"""Deterministic budget-aware controller.

Baseline 3: Uses same budget and feasible set F_t; picks least-friction feasible response
by a fixed validation-tuned rule. Isolates benefit of learning from benefit of accounting.
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
import numpy as np

from ztarb.types import Action, Request
from ztarb.controllers.base import BaseController


class DeterministicBudgetController(BaseController):
    """Deterministic budget-aware controller selecting actions from feasible set F_t.
    
    Tuned on the validation split over search space:
    - th_allow in [0.20, 0.30, 0.40, 0.50, 1.0]
    - th_mfa in [0.45, 0.55, 0.70, 0.85]
    - b_ratio in [0.0, 0.15, 0.25]
    Optimal validation parameters: th_allow=0.30, th_mfa=0.55.
    """

    def __init__(
        self,
        th_allow: float = 0.30,
        th_mfa: float = 0.55,
    ):
        super().__init__(name="Deterministic Budget-Aware")
        self.th_allow = float(th_allow)
        self.th_mfa = float(th_mfa)

    def select_action(
        self,
        observation: np.ndarray,
        feasible_set: List[int],
        policy_mask: List[int],
        risk_score: float,
        request: Request,
        context: Optional[Dict[str, Any]] = None,
    ) -> Action:
        # 1. Low risk (<= th_allow): prioritize least friction feasible response
        if risk_score <= self.th_allow:
            if Action.ALLOW in feasible_set:
                return Action.ALLOW
            elif Action.RESTRICT in feasible_set:
                return Action.RESTRICT
            elif Action.MFA in feasible_set:
                return Action.MFA
            elif Action.DENY in feasible_set:
                return Action.DENY

        # 2. Moderate risk (th_allow < rho <= th_mfa): challenge with MFA if feasible
        elif risk_score <= self.th_mfa:
            if Action.MFA in feasible_set:
                return Action.MFA
            elif Action.RESTRICT in feasible_set:
                return Action.RESTRICT
            elif Action.ALLOW in feasible_set:
                return Action.ALLOW
            elif Action.DENY in feasible_set:
                return Action.DENY

        # 3. Elevated risk: restrict scope or quarantine
        else:
            if Action.QUARANTINE in feasible_set and (request.auth_failures_session >= 3 or risk_score > 0.80):
                return Action.QUARANTINE
            elif Action.RESTRICT in feasible_set:
                return Action.RESTRICT
            elif Action.MFA in feasible_set:
                return Action.MFA

        return Action.DENY
