"""Base interface for Zero-Trust arbitration controllers."""

from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
import numpy as np

from ztarb.types import Action, Request


class BaseController(ABC):
    """Abstract arbitration controller sharing identical evidence and observation space."""

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def select_action(
        self,
        observation: np.ndarray,
        feasible_set: List[int],
        policy_mask: List[int],
        risk_score: float,
        request: Request,
        context: Optional[Dict[str, Any]] = None,
    ) -> Action:
        """Select proposed arbitration action."""
        pass
