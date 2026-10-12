"""Gymnasium environment wrapping simulator stream, budget, shield, and reward.

Citations:
- Eq. (2): Observation s_t
- Eq. (8): Action mask m_t
- Eq. (10)-(11): Feasibility set F_t and arbitration
- Eq. (13): Reward r_t = w_u * U_t - w_l * L_t - w_f * F_t - w_i * I_t
- Section 5: PPO likelihood correctness invariant (stores proposed action in rollout buffer)
"""

from __future__ import annotations
import gymnasium as gym
from gymnasium import spaces
import numpy as np
from typing import Any, Dict, List, Optional, Tuple

from ztarb.types import Action, Request
from ztarb.risk import RiskEstimator
from ztarb.budget import BudgetStore
from ztarb.policy_engine import PolicyEngine
from ztarb.shield import RuntimeShield
from ztarb.features import HistoryWindowTracker, ObservationBuilder
from ztarb.simulator.models import EventOpportunity, SyntheticPrincipal, SyntheticResource
from ztarb.simulator.workload import WorkloadGenerator, get_all_resources
from ztarb.simulator.splits import generate_100_principals


class ZeroTrustArbiterEnv(gym.Env):
    """Zero-Trust Policy Arbiter Gymnasium Environment."""

    metadata = {"render_modes": ["human"]}

    def __init__(
        self,
        principals: Optional[List[SyntheticPrincipal]] = None,
        scenario: str = "benign",
        seed: int = 42,
        b_max: float = 100.0,
        kappa: float = 1500.0,
        p_exp: float = 2.0,
        eta: float = 1.0,
        w_u: float = 1.0,
        w_l: float = 2.0,
        w_f: float = 0.5,
        w_i: float = 0.2,
        apply_shield: bool = True,
        observation_builder: Optional[ObservationBuilder] = None,
        bundle_dir: str = "policy/bundle_v1",
    ):
        super().__init__()
        self.rng = np.random.default_rng(seed)
        self.scenario = scenario
        self.b_max = float(b_max)
        self.kappa = float(kappa)
        self.p_exp = float(p_exp)
        self.eta = float(eta)
        self.w_u = float(w_u)
        self.w_l = float(w_l)
        self.w_f = float(w_f)
        self.w_i = float(w_i)
        self.apply_shield = bool(apply_shield)

        self.principals = principals or generate_100_principals()[:60]
        self.resources = get_all_resources()

        # Components
        self.risk_estimator = RiskEstimator()
        self.policy_engine = PolicyEngine(bundle_dir=bundle_dir, backend="python")
        self.shield = RuntimeShield(kappa=self.kappa)
        self.obs_builder = observation_builder or ObservationBuilder(b_max=self.b_max)
        self.history_tracker = HistoryWindowTracker()

        # Spaces: 27 continuous features, 5 discrete actions
        self.observation_space = spaces.Box(
            low=-5.0, high=5.0, shape=(27,), dtype=np.float32
        )
        self.action_space = spaces.Discrete(5)

        # In-memory budget store per episode
        self.budget_store = BudgetStore(
            kappa=self.kappa,
            p=self.p_exp,
            b_max=self.b_max,
            eta=self.eta,
        )

        # Episode state
        self.current_principal: Optional[SyntheticPrincipal] = None
        self.opportunities: List[EventOpportunity] = []
        self.step_idx: int = 0
        self.current_req: Optional[Request] = None
        self.current_mask: List[int] = [0, 0, 0, 1, 0]
        self.current_feasible: List[int] = [int(Action.DENY)]
        self.current_rho: float = 0.0
        self.current_b_bar: float = self.b_max
        self.current_veto_reasons: Dict[int, str] = {}

    def action_masks(self) -> np.ndarray:
        """Return binary mask m_t for sb3-contrib MaskablePPO.
        
        # Eq. (8): m_t(a) = 1[P_v(q, x, h, a) = permit]
        """
        return np.array(self.current_mask, dtype=bool)

    def reset(
        self,
        *,
        seed: Optional[int] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        super().reset(seed=seed)
        if seed is not None:
            self.rng = np.random.default_rng(seed)

        # Select principal and generate scenario stream
        p_idx = int(self.rng.integers(0, len(self.principals)))
        self.current_principal = self.principals[p_idx]

        # Scenario override from options
        scen = (options and options.get("scenario")) or self.scenario
        ep_seed = int(self.rng.integers(0, 1000000))
        gen = WorkloadGenerator(seed=ep_seed)
        self.opportunities = gen.generate_episode_stream(self.current_principal, scenario=scen)
        self.step_idx = 0

        # Reset budget and history
        self.budget_store = BudgetStore(
            kappa=self.kappa,
            p=self.p_exp,
            b_max=self.b_max,
            eta=self.eta,
        )
        self.history_tracker = HistoryWindowTracker()

        # Prime first opportunity
        obs = self._prime_next_opportunity()
        info = {
            "principal": self.current_principal.principal_id,
            "scenario": scen,
            "mask": self.current_mask,
            "feasible_set": self.current_feasible,
        }
        return obs, info

    def _prime_next_opportunity(self) -> np.ndarray:
        """Prepare observation and authoritative feasibility set for current step."""
        opp = self.opportunities[self.step_idx]
        res_info = self.resources.get(opp.resource)
        sigma = res_info.sensitivity if res_info else 0.5

        # Build Request model q_t (Eq. 1)
        # Note: ground truth fields are passed to Request ONLY for reward/metric evaluation
        self.current_req = Request(
            request_id=opp.opportunity_id,
            principal=opp.principal,
            device=opp.device,
            resource=opp.resource,
            operation=opp.operation,
            timestamp=opp.timestamp,
            volume=opp.desired_volume,
            device_posture=opp.device_posture,
            auth_failures_session=opp.auth_failures,
            unresolved_alerts=opp.unresolved_alerts,
            evidence_timestamp=opp.timestamp,
            ground_truth_is_attack=opp.is_attack,
            ground_truth_family=opp.attack_family,
            ground_truth_target_volume=opp.target_volume,
        )

        # 1. Compute Eq. (3) Risk score rho_t
        self.current_rho, _ = self.risk_estimator.compute_risk(
            self.current_req,
            role_mean_volume=self.current_principal.mean_volume,
            known_devices=self.current_principal.home_devices,
        )

        # 2. Compute Eq. (8) Policy mask m_t
        self.current_mask, _, _ = self.policy_engine.evaluate_mask(
            self.current_req,
            role=self.current_principal.role,
        )

        # 3. Authoritative budget B_bar (Eq. 5)
        b_info = self.budget_store.get_budget(self.current_principal.principal_id, opp.timestamp)
        self.current_b_bar = b_info["balance"]

        # 4. Authoritative feasible set F_t (Eq. 10)
        self.current_feasible, self.current_veto_reasons = self.shield.compute_feasible_set(
            req=self.current_req,
            b_bar=self.current_b_bar,
            policy_mask=self.current_mask,
            risk_score=self.current_rho,
            resource_sensitivity=sigma,
            budget_store=self.budget_store,
            current_ts=opp.timestamp,
        )

        # 5. Extract history features and observation s_t (Eq. 2)
        h_stats = self.history_tracker.get_stats(opp.timestamp)
        raw_obs = self.obs_builder.build_raw(
            req=self.current_req,
            resource_sensitivity=sigma,
            history_stats=h_stats,
            rho_t=self.current_rho,
            b_current=self.current_b_bar,
            policy_mask=self.current_mask,
        )
        return self.obs_builder.normalize(raw_obs)

    def step(self, action: int) -> Tuple[np.ndarray, float, bool, bool, Dict[str, Any]]:
        """Gym step receiving proposed action from policy.
        
        PPO LIKELIHOOD CORRECTNESS:
        - `action` is the PROPOSED action a_tilde.
        - Shield computes executed action a_t in F_t.
        - Step returns reward and state from executed action.
        - Info records proposed vs executed.
        - MaskablePPO stores `action` (proposed) in rollout buffer with mask m_t.
        """
        proposed_action = Action(int(action))
        opp = self.opportunities[self.step_idx]
        res_info = self.resources.get(opp.resource)
        sigma = res_info.sensitivity if res_info else 0.5

        # 1. Apply runtime shield (Eq. 11) if enabled
        if self.apply_shield:
            executed_action, overridden, veto_reason = self.shield.arbitrate(
                proposed_action=proposed_action,
                feasible_set=self.current_feasible,
                veto_reasons=self.current_veto_reasons,
            )
        else:
            # Shield disabled ablation: execute proposal directly
            executed_action = proposed_action
            overridden = False
            veto_reason = None

        # 2. Budget reservation for executed action (Eq. 4-6)
        charge = self.budget_store.compute_charge(
            action=executed_action,
            requested_volume=opp.desired_volume,
            resource_sensitivity=sigma,
            risk_score=self.current_rho,
        )
        is_quarantine = (executed_action == Action.QUARANTINE)
        res_ok, b_before, b_after = self.budget_store.check_and_reserve(
            request_id=opp.opportunity_id,
            principal=self.current_principal.principal_id,
            current_ts=opp.timestamp,
            charge=charge,
            is_quarantine=is_quarantine,
        )

        # If reservation failed (can happen in no-shield ablation), fall back to DENY
        if not res_ok:
            executed_action = Action.DENY
            overridden = True
            veto_reason = "Budget reservation overdrawn"

        # 3. Update history window
        vol_transferred = self.budget_store.compute_action_volume(executed_action, opp.desired_volume)
        is_fail = (opp.auth_failures > 0)
        is_interv = overridden or (executed_action in (Action.DENY, Action.QUARANTINE))
        self.history_tracker.add_event(
            timestamp=opp.timestamp,
            resource=opp.resource,
            volume_transferred=vol_transferred,
            is_challenge_fail=is_fail,
            is_intervention=is_interv,
        )

        # 4. Compute reward Eq. (13): r_t = w_u * U_t - w_l * L_t - w_f * F_t - w_i * I_t
        u_t = 0.0  # Useful authorized work completed (benign requests only)
        l_t = 0.0  # Realized attack loss (exfiltrated volume * sensitivity)
        f_t = 0.0  # Legitimate user friction
        i_t = 1.0 if overridden else 0.0  # Shield intervention indicator
        containment_bonus = 0.0  # RL reward incentive for active containment

        if opp.is_attack:
            # Attack request: never produces legitimate useful work (U_t = 0.0)
            if executed_action == Action.ALLOW:
                l_t = opp.desired_volume * sigma
            elif executed_action == Action.RESTRICT:
                l_t = (0.25 * opp.desired_volume) * sigma
            elif executed_action == Action.MFA:
                # Adversary lacking physical step-up authenticator fails challenge
                l_t = 0.0
            elif executed_action == Action.DENY:
                l_t = 0.0
                containment_bonus = 0.2
            elif executed_action == Action.QUARANTINE:
                # Active quarantine containment bonus for RL policy reward (not counted as useful work)
                l_t = 0.0
                containment_bonus = 0.5
        else:
            # Benign legitimate request:
            if executed_action == Action.ALLOW:
                u_t = opp.desired_volume
                f_t = 0.0
            elif executed_action == Action.MFA:
                # Legitimate employee completes step-up prompt: work is authorized and completed
                # with small user interruption friction
                u_t = opp.desired_volume
                f_t = 0.10  # MFA challenge friction
            elif executed_action == Action.RESTRICT:
                u_t = 0.25 * opp.desired_volume
                f_t = 0.20  # Unnecessary restricted scope friction
            elif executed_action == Action.DENY:
                u_t = 0.0
                f_t = 1.00  # False denial friction
            elif executed_action == Action.QUARANTINE:
                u_t = 0.0
                f_t = 3.00  # Erroneous quarantine severe friction

        # Eq. (13) with containment incentive
        reward = float(self.w_u * u_t - self.w_l * l_t - self.w_f * f_t - self.w_i * i_t + containment_bonus)

        info = {
            "proposed_action": int(proposed_action),
            "executed_action": int(executed_action),
            "shield_overridden": overridden,
            "shield_reason": veto_reason,
            "risk_score": self.current_rho,
            "budget_before": b_before,
            "budget_after": b_after,
            "charge": charge,
            "feasible_set": self.current_feasible,
            "policy_mask": self.current_mask,
            "is_attack": opp.is_attack,
            "attack_family": opp.attack_family,
            "useful_work": u_t,
            "attack_loss": l_t,
            "friction": f_t,
            "intervention": i_t,
        }

        # Advance episode
        self.step_idx += 1
        terminated = (self.step_idx >= len(self.opportunities))
        truncated = False

        if not terminated:
            next_obs = self._prime_next_opportunity()
        else:
            # Terminal dummy observation
            next_obs = np.zeros(27, dtype=np.float32)

        return next_obs, reward, terminated, truncated, info
