"""Static RBAC/ABAC controller.

Baseline 1: Stateless; uses the policy engine only; proposes ALLOW if policy permits, else DENY.
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
import numpy as np

from ztarb.types import Action, Request
from ztarb.controllers.base import BaseController


class StaticRBACController(BaseController):
    """Stateless RBAC/ABAC baseline relying solely on policy mask."""

    def __init__(self):
        super().__init__(name="Static RBAC/ABAC")

    def select_action(
        self,
        observation: np.ndarray,
        feasible_set: List[int],
        policy_mask: List[int],
        risk_score: float,
        request: Request,
        context: Optional[Dict[str, Any]] = None,
    ) -> Action:
        # If policy permits ALLOW, propose ALLOW; else if MFA permitted, propose MFA; else DENY
        if policy_mask[Action.ALLOW] == 1:
            return Action.ALLOW
        elif policy_mask[Action.MFA] == 1:
            return Action.MFA
        elif policy_mask[Action.RESTRICT] == 1:
            return Action.RESTRICT
        else:
            return Action.DENY
