"""Deny-All baseline controller."""

from __future__ import annotations
from typing import Any, Dict, List, Optional
import numpy as np

from ztarb.types import Action, Request
from ztarb.controllers.base import BaseController


class DenyAllController(BaseController):
    """Deny-All baseline: always rejects every request with DENY."""

    def __init__(self):
        super().__init__(name="Deny-All")

    def select_action(
        self,
        observation: np.ndarray,
        feasible_set: List[int],
        policy_mask: List[int],
        risk_score: float,
        request: Request,
        context: Optional[Dict[str, Any]] = None,
    ) -> Action:
        return Action.DENY
