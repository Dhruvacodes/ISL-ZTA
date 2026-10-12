"""Risk score estimation engine.

Citation:
- Eq. (3): rho_t = clip01(sum_j w_j * x_risk_j), w_j >= 0, sum w_j = 1

NOTE: rho_t is an ordinal risk index, NOT a calibrated Bayesian probability.
It serves as a monotone heuristic of contextual anomaly for budget charge weighting.
"""

from __future__ import annotations
from typing import Dict, List, Optional
import numpy as np

from ztarb.types import Request


class RiskEstimator:
    """Computes transparent weighted risk score rho_t in [0, 1].
    
    # Eq. (3)
    """

    def __init__(self, weights: Optional[Dict[str, float]] = None):
        # Default validation-tuned weights (sum to 1.0)
        self.weights = weights or {
            "auth_anomaly": 0.35,
            "device_weakness": 0.25,
            "pattern_anomaly": 0.25,
            "alerts": 0.15,
        }
        total = sum(self.weights.values())
        if abs(total - 1.0) > 1e-6:
            # Normalize to guarantee sum w_j = 1
            self.weights = {k: v / total for k, v in self.weights.items()}

    def extract_features(
        self,
        request: Request,
        role_mean_volume: float = 0.05,
        known_devices: Optional[List[str]] = None,
    ) -> Dict[str, float]:
        """Extract normalized risk component indicators x_risk_j in [0, 1]."""
        # 1. Auth anomaly: auth failures and unfamiliar device
        auth_fail_norm = min(1.0, request.auth_failures_session / 5.0)
        device_unfamiliar = 0.0
        if known_devices and request.device not in known_devices:
            device_unfamiliar = 0.5
        x_auth = min(1.0, 0.7 * auth_fail_norm + 0.3 * device_unfamiliar)

        # 2. Device weakness: 1 - posture score
        x_posture = float(np.clip(1.0 - request.device_posture, 0.0, 1.0))

        # 3. Pattern anomaly: volume anomaly vs role baseline
        vol_ratio = request.volume / max(1e-4, role_mean_volume)
        # saturates at 5x role mean
        x_pattern = float(np.clip((vol_ratio - 1.0) / 4.0, 0.0, 1.0)) if vol_ratio > 1.0 else 0.0

        # 4. Historical alerts
        x_alerts = min(1.0, request.unresolved_alerts / 3.0)

        return {
            "auth_anomaly": float(x_auth),
            "device_weakness": float(x_posture),
            "pattern_anomaly": float(x_pattern),
            "alerts": float(x_alerts),
        }

    def compute_risk(
        self,
        request: Request,
        role_mean_volume: float = 0.05,
        known_devices: Optional[List[str]] = None,
    ) -> tuple[float, Dict[str, float]]:
        """Compute Eq. (3): rho = clip01(sum_j w_j * x_risk_j)."""
        feats = self.extract_features(request, role_mean_volume, known_devices)
        score = sum(self.weights[k] * feats[k] for k in self.weights)
        # Eq. (3)
        rho = float(np.clip(score, 0.0, 1.0))
        return rho, feats
