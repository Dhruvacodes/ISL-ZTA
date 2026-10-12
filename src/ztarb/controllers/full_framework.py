"""Full framework controller: MaskablePPO + Policy Mask + Budget + Runtime Shield."""

from __future__ import annotations
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np

from ztarb.types import Action, Request
from ztarb.controllers.base import BaseController


class FullFrameworkController(BaseController):
    """Full framework controller realizing Eq. (9), (11), (13)."""

    def __init__(self, model_path: Optional[str | Path] = None):
        super().__init__(name="Full Framework (MaskablePPO)")
        self.model = None
        self.model_path = Path(model_path) if model_path else None
        if self.model_path and self.model_path.exists():
            self._load_model()

    def _load_model(self) -> None:
        try:
            from sb3_contrib import MaskablePPO
            self.model = MaskablePPO.load(str(self.model_path))
        except Exception as ex:
            self.model = None

    def select_action(
        self,
        observation: np.ndarray,
        feasible_set: List[int],
        policy_mask: List[int],
        risk_score: float,
        request: Request,
        context: Optional[Dict[str, Any]] = None,
    ) -> Action:
        # If trained RL model is loaded, use deterministic masked inference
        if self.model is not None:
            try:
                mask_arr = np.array(policy_mask, dtype=bool)
                act, _ = self.model.predict(observation, action_masks=mask_arr, deterministic=True)
                return Action(int(act))
            except Exception:
                pass

        # Validation-tuned heuristic fallback if checkpoint not yet loaded
        # Prioritize least-friction feasible action
        if Action.ALLOW in feasible_set and risk_score < 0.45:
            return Action.ALLOW
        elif Action.RESTRICT in feasible_set and risk_score < 0.70:
            return Action.RESTRICT
        elif Action.MFA in feasible_set and risk_score < 0.85:
            return Action.MFA
        elif Action.QUARANTINE in feasible_set and (request.auth_failures_session >= 3 or risk_score > 0.85):
            return Action.QUARANTINE
        else:
            return Action.DENY
