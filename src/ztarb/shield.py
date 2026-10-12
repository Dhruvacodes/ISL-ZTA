"""Runtime safety shield implementing feasibility filtering and fail-closed arbitration.

Citations:
- Eq. (10): F_t = {a : m_t(a)=1, c_t(a) <= B_bar, C_t(a) <= delta(r_t), H_t(a)=1}
- Eq. (11): a_t = a_tilde if a_tilde in F_t else DENY
"""

from __future__ import annotations
from typing import Dict, List, Optional, Set, Tuple

from ztarb.types import Action, Request
from ztarb.budget import BudgetStore


class RuntimeShield:
    """Evaluates authoritative feasibility set F_t and enforces Eq. (10)-(11)."""

    def __init__(
        self,
        kappa: float = 10.0,
        delta_thresholds: Optional[Dict[str, float]] = None,
        max_evidence_age_sec: float = 300.0,  # 5 minutes evidence freshness
    ):
        self.kappa = float(kappa)
        self.delta_thresholds = delta_thresholds or {
            "low": 1.0,
            "medium": 0.6,
            "high": 0.3,
        }
        self.max_evidence_age_sec = float(max_evidence_age_sec)

    def get_delta_for_sensitivity(self, sigma: float) -> float:
        """Map sensitivity sigma to threshold delta(r_t)."""
        if sigma <= 0.35:
            return self.delta_thresholds.get("low", 1.0)
        elif sigma <= 0.75:
            return self.delta_thresholds.get("medium", 0.6)
        else:
            return self.delta_thresholds.get("high", 0.3)

    def compute_evidence_freshness(self, req: Request, current_ts: float) -> bool:
        """Check H_t(a) evidence freshness requirement.
        
        If evidence is older than max_evidence_age_sec, H_t(a) = 0 for non-DENY actions.
        """
        if req.evidence_timestamp <= 0.0:
            # If not explicitly provided, treat as fresh if timestamp is consistent
            return True
        age = max(0.0, current_ts - req.evidence_timestamp)
        return age <= self.max_evidence_age_sec

    def compute_feasible_set(
        self,
        req: Request,
        b_bar: float,
        policy_mask: List[int],
        risk_score: float,
        resource_sensitivity: float,
        budget_store: BudgetStore,
        current_ts: float,
    ) -> Tuple[List[int], Dict[int, str]]:
        """Compute Eq. (10): F_t = {a : m_t(a)=1, c_t(a) <= B_bar, C_t(a) <= delta(r_t), H_t(a)=1}."""
        feasible: List[int] = []
        veto_reasons: Dict[int, str] = {}

        delta = self.get_delta_for_sensitivity(resource_sensitivity)
        fresh = self.compute_evidence_freshness(req, current_ts)

        # Evaluate feasibility for each of the 5 actions:
        for action in Action:
            a_idx = int(action)

            # DENY is always unconditionally feasible at platform level
            if action == Action.DENY:
                feasible.append(a_idx)
                continue

            # 1. Policy mask constraint: m_t(a) == 1
            if policy_mask[a_idx] != 1:
                veto_reasons[a_idx] = "Policy mask prohibited (m_t=0)"
                continue

            # 2. Evidence freshness constraint: H_t(a) == 1
            if not fresh:
                veto_reasons[a_idx] = "Stale evidence (H_t=0)"
                continue

            # 3. Budget charge constraint: c_t(a) <= B_bar
            charge = budget_store.compute_charge(
                action=action,
                requested_volume=req.volume,
                resource_sensitivity=resource_sensitivity,
                risk_score=risk_score,
            )
            if charge > b_bar + 1e-9:
                veto_reasons[a_idx] = f"Insufficient budget (charge={charge:.3f} > balance={b_bar:.3f})"
                continue

            # 4. Exposure boundary constraint: C_t(a) <= delta(r_t)
            # C_t(a) = c_t(a) / max(kappa, eps)
            c_norm = charge / max(self.kappa, 1e-6)
            if c_norm > delta + 1e-9:
                veto_reasons[a_idx] = f"Exceeds sensitivity exposure threshold (C_t={c_norm:.3f} > delta={delta:.3f})"
                continue

            # All constraints satisfied
            feasible.append(a_idx)

        return feasible, veto_reasons

    def arbitrate(
        self,
        proposed_action: Action,
        feasible_set: List[int],
        veto_reasons: Dict[int, str],
    ) -> Tuple[Action, bool, Optional[str]]:
        """Execute selection rule: Eq. (11).
        
        a_t = a_tilde if a_tilde in F_t else DENY
        """
        p_idx = int(proposed_action)
        if p_idx in feasible_set:
            return proposed_action, False, None
        else:
            reason = veto_reasons.get(p_idx, f"Action {proposed_action.name} not in feasible set {feasible_set}")
            return Action.DENY, True, f"Shield vetoed {proposed_action.name} -> DENY: {reason}"
