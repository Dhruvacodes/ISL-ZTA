"""Unmasked PPO controller (simulator-only baseline).

Baseline 4: PPO agent trained without policy action masking.
Invalid proposals are handled by the runtime shield (vetoed to DENY).
"""

from __future__ import annotations
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np

from ztarb.types import Action, Request
from ztarb.controllers.base import BaseController


class UnmaskedPPOController(BaseController):
    """Unmasked PPO controller without action masking."""

    def __init__(self, model_path: Optional[str | Path] = None):
        super().__init__(name="Unmasked PPO")
        self.model = None
        self.model_path = Path(model_path) if model_path else None
        if self.model_path and self.model_path.exists():
            self._load_model()

    def _load_model(self) -> None:
        try:
            from stable_baselines3 import PPO
            self.model = PPO.load(str(self.model_path))
        except Exception:
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
        if self.model is not None:
            try:
                act, _ = self.model.predict(observation, deterministic=True)
                return Action(int(act))
            except Exception:
                pass

        # Fallback: unconstrained proposal (e.g. proposes ALLOW unless high risk)
        if risk_score < 0.60:
            return Action.ALLOW
        elif risk_score < 0.85:
            return Action.RESTRICT
        else:
            return Action.DENY
