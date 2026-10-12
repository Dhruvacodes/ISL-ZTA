"""Tests for simulator, workload generator, and ground-truth observation isolation.

Citations:
- Section 3.1: Ground truth isolation test
- Section 4: 60/20/20 splits, attack families, action-independent event stream
"""

import inspect
import pytest
import numpy as np

from ztarb.types import Action, Request
from ztarb.features import ObservationBuilder, HistoryWindowTracker
from ztarb.simulator import (
    WorkloadGenerator,
    generate_100_principals,
    get_principal_splits,
    get_all_resources,
)


def test_observation_builder_ground_truth_isolation():
    """CRITICAL TEST: Observation builder must NEVER access ground truth flags or future events.

    Asserts that the observation builder signature and implementation do not ingest ground-truth fields.
    """
    builder = ObservationBuilder(b_max=100.0)

    # Inspect build_raw signature
    sig = inspect.signature(builder.build_raw)
    param_names = list(sig.parameters.keys())
    assert "ground_truth" not in param_names
    assert "is_attack" not in param_names
    assert "true_intent" not in param_names

    req = Request(
        principal="victim_user",
        device="victim_dev",
        resource="payroll_records",
        operation="read",
        timestamp=500.0,
        volume=0.25,
        device_posture=0.88,
        # Ground truth present on Request model for rewards/metrics:
        ground_truth_is_attack=True,
        ground_truth_family="burst_access",
        ground_truth_target_volume=0.50,
    )

    history = [1.0, 0.05, 1.0, 0.0, 0.0, 2.0, 0.10, 2.0, 0.0, 0.0]
    mask = [1, 1, 1, 1, 0]

    obs = builder.build_raw(
        req=req,
        resource_sensitivity=1.0,
        history_stats=history,
        rho_t=0.65,
        b_current=80.0,
        policy_mask=mask,
    )

    # Length of observation is 27 (fixed schema)
    assert len(obs) == 27
    assert isinstance(obs, np.ndarray)

    # Alter ground truth fields on request
    req2 = Request(
        principal="victim_user",
        device="victim_dev",
        resource="payroll_records",
        operation="read",
        timestamp=500.0,
        volume=0.25,
        device_posture=0.88,
        ground_truth_is_attack=False,
        ground_truth_family=None,
        ground_truth_target_volume=0.0,
    )
    obs2 = builder.build_raw(
        req=req2,
        resource_sensitivity=1.0,
        history_stats=history,
        rho_t=0.65,
        b_current=80.0,
        policy_mask=mask,
    )

    # Observation vector MUST be 100% identical regardless of ground truth fields!
    assert np.array_equal(obs, obs2), "Observation vector must be invariant to ground truth fields!"


def test_principal_splits_disjoint_60_20_20():
    """Verify exactly 100 synthetic principals partitioned 60/20/20 into disjoint sets."""
    all_p = generate_100_principals()
    assert len(all_p) == 100

    train_ids, val_ids, test_ids = get_principal_splits()
    assert len(train_ids) == 60
    assert len(val_ids) == 20
    assert len(test_ids) == 20

    # Ensure completely disjoint
    s_train, s_val, s_test = set(train_ids), set(val_ids), set(test_ids)
    assert len(s_train.intersection(s_val)) == 0
    assert len(s_train.intersection(s_test)) == 0
    assert len(s_val.intersection(s_test)) == 0


def test_action_independent_event_generator_reproducibility():
    """Verify action-independent opportunity streams are 100% deterministic for paired comparisons."""
    principals = generate_100_principals()
    p0 = principals[0]

    gen1 = WorkloadGenerator(seed=12345)
    stream1 = gen1.generate_episode_stream(p0, scenario="gradual_exfiltration")

    gen2 = WorkloadGenerator(seed=12345)
    stream2 = gen2.generate_episode_stream(p0, scenario="gradual_exfiltration")

    assert len(stream1) == len(stream2)
    for e1, e2 in zip(stream1, stream2):
        assert e1.opportunity_id == e2.opportunity_id
        assert e1.timestamp == e2.timestamp
        assert e1.resource == e2.resource
        assert e1.desired_volume == e2.desired_volume
        assert e1.is_attack == e2.is_attack


def test_all_six_attack_families_generate():
    """Verify all 6 attack families generate opportunities with correct metadata."""
    principals = generate_100_principals()
    p = principals[0]
    gen = WorkloadGenerator(seed=99)

    families = [
        "burst_access",
        "gradual_exfiltration",
        "repeated_auth_failures",
        "credential_abuse",
        "session_resets",
        "adaptive_pacing",
    ]

    for fam in families:
        stream = gen.generate_episode_stream(p, scenario=fam)
        attacks = [e for e in stream if e.is_attack]
        assert len(attacks) > 0, f"Attack family {fam} produced no attack events"
        assert all(e.attack_family == fam for e in attacks)


def test_rbac_attack_success_greater_than_zero_on_evasion_families():
    """Verify that static stateless RBAC is meaningfully exploited by credential-compromise attacks.
    
    Part A.1 Acceptance Criterion:
    Asserts RBAC attack success > 0 on low-and-slow (gradual_exfiltration), adaptive-pacing,
    and session-reset families.
    """
    from ztarb.env import ZeroTrustArbiterEnv
    from ztarb.controllers.static_rbac import StaticRBACController
    from ztarb.evaluate import run_episode

    principals = generate_100_principals()
    p = principals[0]
    ctrl = StaticRBACController()

    target_families = [
        "gradual_exfiltration",
        "adaptive_pacing",
        "session_resets",
    ]

    for fam in target_families:
        env = ZeroTrustArbiterEnv(
            principals=[p],
            scenario=fam,
            seed=42,
            apply_shield=False,  # Static RBAC baseline does not possess runtime shield
        )
        res = run_episode(ctrl, env)
        assert res["target_volume"] > 0, f"Target volume must be positive for {fam}"
        assert res["exfiltrated_volume"] > 0, f"RBAC must allow volume for {fam}"
        assert res["attack_success"] > 0.0, (
            f"Static RBAC attack success must be > 0 on {fam}, got {res['attack_success']}. "
            f"Exfiltrated: {res['exfiltrated_volume']} / {res['target_volume']}"
        )
