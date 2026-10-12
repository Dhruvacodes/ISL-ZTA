"""Per-request risk-threshold controller.

Baseline 2: Stateless threshold heuristics on risk index rho_t tuned on validation split.
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
import numpy as np

from ztarb.types import Action, Request
from ztarb.controllers.base import BaseController


class RiskThresholdController(BaseController):
    """Proposes actions based on tuned risk score thresholds."""

    def __init__(
        self,
        th_allow: float = 0.30,
        th_mfa: float = 0.45,
        th_restrict: float = 0.70,
    ):
        super().__init__(name="Risk Threshold")
        self.th_allow = float(th_allow)
        self.th_mfa = float(th_mfa)
        self.th_restrict = float(th_restrict)

    def select_action(
        self,
        observation: np.ndarray,
        feasible_set: List[int],
        policy_mask: List[int],
        risk_score: float,
        request: Request,
        context: Optional[Dict[str, Any]] = None,
    ) -> Action:
        # Low risk: propose ALLOW if permitted by policy
        if risk_score <= self.th_allow:
            if policy_mask[Action.ALLOW] == 1:
                return Action.ALLOW
            elif policy_mask[Action.MFA] == 1:
                return Action.MFA
            elif policy_mask[Action.RESTRICT] == 1:
                return Action.RESTRICT
            return Action.DENY

        # Moderate risk: challenge with MFA if permitted
        elif risk_score <= self.th_mfa:
            if policy_mask[Action.MFA] == 1:
                return Action.MFA
            elif policy_mask[Action.RESTRICT] == 1:
                return Action.RESTRICT
            elif policy_mask[Action.ALLOW] == 1:
                return Action.ALLOW
            return Action.DENY

        # Elevated risk: RESTRICT scope
        elif risk_score <= self.th_restrict:
            if policy_mask[Action.RESTRICT] == 1:
                return Action.RESTRICT
            elif policy_mask[Action.MFA] == 1:
                return Action.MFA
            return Action.DENY

        # High risk: QUARANTINE if available, else DENY
        else:
            if policy_mask[Action.QUARANTINE] == 1 and request.auth_failures_session >= 3:
                return Action.QUARANTINE
            return Action.DENY
