"""Feature extraction and observation state construction.

Citations:
- Eq. (2): s_t = [x_t, h_t, rho_t, B_t / B_max, m_t]
- Section 3.1: Ground truth isolation, normalization statistics
"""

from __future__ import annotations
import json
import math
from collections import deque
from pathlib import Path
from typing import Any, Deque, Dict, List, Optional, Tuple
import numpy as np

from ztarb.types import Action, Request


class HistoryWindowTracker:
    """Maintains sliding event history over 5-minute (300s) and 1-hour (3600s) windows."""

    def __init__(self):
        # Stores tuples: (timestamp, resource, volume_transferred, is_challenge_fail, is_intervention)
        self.events: Deque[Tuple[float, str, float, bool, bool]] = deque()

    def add_event(
        self,
        timestamp: float,
        resource: str,
        volume_transferred: float,
        is_challenge_fail: bool,
        is_intervention: bool,
    ) -> None:
        self.events.append((timestamp, resource, volume_transferred, is_challenge_fail, is_intervention))
        self._prune(timestamp)

    def _prune(self, current_ts: float) -> None:
        cutoff = current_ts - 3600.0
        while self.events and self.events[0][0] < cutoff:
            self.events.popleft()

    def get_stats(self, current_ts: float) -> List[float]:
        """Compute window metrics: [req_count, vol, distinct_res, fail_count, interventions]

        for 5m and 1h windows (10 features total).
        """
        self._prune(current_ts)
        cutoff_5m = current_ts - 300.0

        count_5m, vol_5m, fails_5m, interv_5m = 0, 0.0, 0, 0
        resources_5m = set()

        count_1h, vol_1h, fails_1h, interv_1h = 0, 0.0, 0, 0
        resources_1h = set()

        for ts, res, vol, fail, interv in self.events:
            # 1h window
            count_1h += 1
            vol_1h += vol
            resources_1h.add(res)
            if fail:
                fails_1h += 1
            if interv:
                interv_1h += 1

            # 5m window
            if ts >= cutoff_5m:
                count_5m += 1
                vol_5m += vol
                resources_5m.add(res)
                if fail:
                    fails_5m += 1
                if interv:
                    interv_5m += 1

        return [
            float(count_5m),
            float(vol_5m),
            float(len(resources_5m)),
            float(fails_5m),
            float(interv_5m),
            float(count_1h),
            float(vol_1h),
            float(len(resources_1h)),
            float(fails_1h),
            float(interv_1h),
        ]


class ObservationBuilder:
    """Builds normalized observation vector s_t from request and context.
    
    # Eq. (2): s_t = [x_t, h_t, rho_t, B_t / B_max, m_t]
    
    CRITICAL: Ground truth attributes (attack flags, target volume, true intent)
    are strictly prohibited and never accessed here!
    """

    def __init__(self, b_max: float = 100.0):
        self.b_max = float(b_max)
        self.norm_means: Optional[np.ndarray] = None
        self.norm_stds: Optional[np.ndarray] = None

    def build_raw(
        self,
        req: Request,
        resource_sensitivity: float,
        history_stats: List[float],
        rho_t: float,
        b_current: float,
        policy_mask: List[int],
    ) -> np.ndarray:
        """Construct raw unnormalized feature vector."""
        # 1. x_t: request attributes
        sigma = float(resource_sensitivity)
        op_val = 0.0 if req.operation == "read" else (0.5 if req.operation == "write" else 1.0)
        vol = float(req.volume)
        hour = (req.timestamp % 86400.0) / 3600.0
        sin_hr = math.sin(2.0 * math.pi * hour / 24.0)
        cos_hr = math.cos(2.0 * math.pi * hour / 24.0)
        posture = float(req.device_posture)
        auth_fails = float(req.auth_failures_session)
        mfa_flag = 1.0 if req.mfa_passed else 0.0
        ev_age = float(max(0.0, req.timestamp - req.evidence_timestamp)) if req.evidence_timestamp > 0 else 0.0
        missing_dev = 1.0 if not req.device else 0.0

        x_t = [
            sigma,
            op_val,
            vol,
            sin_hr,
            cos_hr,
            posture,
            auth_fails,
            mfa_flag,
            ev_age / 300.0,  # normalized by 5m
            missing_dev,
        ]

        # 2. h_t: history stats (10 features)
        h_t = list(history_stats)

        # 3. rho_t: risk score (1 feature)
        # 4. B_t / B_max: normalized budget (1 feature)
        # 5. m_t: policy mask (5 features)
        b_norm = float(np.clip(b_current / self.b_max, 0.0, 1.0))
        m_t = [float(v) for v in policy_mask]

        # Concatenate: 10 + 10 + 1 + 1 + 5 = 27 features
        raw = np.array(x_t + h_t + [rho_t, b_norm] + m_t, dtype=np.float32)
        return raw

    def fit_normalizer(self, raw_samples: List[np.ndarray]) -> None:
        """Fit normalization stats on training split."""
        if not raw_samples:
            return
        arr = np.stack(raw_samples, axis=0)
        self.norm_means = np.mean(arr, axis=0)
        self.norm_stds = np.std(arr, axis=0)
        # Avoid zero division
        self.norm_stds[self.norm_stds < 1e-4] = 1.0

    def normalize(self, raw: np.ndarray) -> np.ndarray:
        """Standardize features using fitted training statistics."""
        if self.norm_means is None or self.norm_stds is None:
            return raw
        # Keep mask and b_norm bounded, standardize other continuous features
        normed = (raw - self.norm_means) / self.norm_stds
        # Leave mask and budget unstandardized for explicit semantic preservation
        # Indices 20 (rho), 21 (b_norm), 22-26 (mask)
        normed[20:] = raw[20:]
        return np.clip(normed, -5.0, 5.0).astype(np.float32)

    def save_stats(self, filepath: str | Path) -> None:
        p = Path(filepath)
        p.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "means": self.norm_means.tolist() if self.norm_means is not None else [],
            "stds": self.norm_stds.tolist() if self.norm_stds is not None else [],
            "b_max": self.b_max,
        }
        with open(p, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def load_stats(self, filepath: str | Path) -> None:
        p = Path(filepath)
        if not p.exists():
            return
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
        if data.get("means") and data.get("stds"):
            self.norm_means = np.array(data["means"], dtype=np.float32)
            self.norm_stds = np.array(data["stds"], dtype=np.float32)
            self.b_max = float(data.get("b_max", 100.0))
