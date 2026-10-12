"""Disjoint principal partition splits (60% train, 20% validation, 20% test)."""

from __future__ import annotations
from typing import Dict, List, Tuple
from ztarb.simulator.models import SyntheticPrincipal


def generate_100_principals() -> List[SyntheticPrincipal]:
    """Deterministically instantiate 100 synthetic principals matching workload manifest."""
    principals: List[SyntheticPrincipal] = []
    roles = ["engineering", "finance", "support", "executive"]
    role_weights = [40, 20, 25, 15]

    role_assignments = []
    for r, count in zip(roles, role_weights):
        role_assignments.extend([r] * count)

    for i, role in enumerate(role_assignments):
        pid = f"user_{i:03d}"
        devices = [f"dev_{pid}_work", f"dev_{pid}_mobile"]
        if role == "engineering":
            rate, p_mean = 12.0, 0.85
        elif role == "finance":
            rate, p_mean = 8.0, 0.90
        elif role == "support":
            rate, p_mean = 15.0, 0.80
        else:
            rate, p_mean = 4.0, 0.78

        principals.append(
            SyntheticPrincipal(
                principal_id=pid,
                role=role,
                home_devices=devices,
                mean_volume=0.03,
                posture_mean=p_mean,
                posture_std=0.08,
                rate_per_hour=rate,
            )
        )
    return principals


def get_principal_splits() -> Tuple[List[str], List[str], List[str]]:
    """Return principal IDs partitioned 60/20/20 into train, val, test."""
    all_p = generate_100_principals()
    train_ids = [p.principal_id for p in all_p[:60]]
    val_ids = [p.principal_id for p in all_p[60:80]]
    test_ids = [p.principal_id for p in all_p[80:100]]
    return train_ids, val_ids, test_ids
