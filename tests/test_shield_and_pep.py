"""Unit, property-based, and invariant tests for Runtime Shield and PEP.

Citations:
- Eq. (10): Feasible set F_t
- Eq. (11): Selection rule a_t = a_tilde if a_tilde in F_t else DENY
- Section 3.5: Conditional invariant: executed action in F_t and B_{t+1} >= 0
"""

import time
import pytest
from hypothesis import given, strategies as st, settings

from ztarb.types import Action, Request, Authorization, EnforcementAckStatus
from ztarb.budget import BudgetStore
from ztarb.policy_engine import PolicyEngine
from ztarb.shield import RuntimeShield
from ztarb.pep import PolicyEnforcementPoint


SECRET_KEY = b"test-secret-key-zt-arbiter-12345"


def test_shield_feasibility_and_selection():
    """Verify Eq. (10) and Eq. (11): feasibility filtering and override to DENY."""
    shield = RuntimeShield(kappa=10.0)
    store = BudgetStore(kappa=10.0, b_max=100.0)

    req = Request(
        principal="alice",
        device="dev-1",
        resource="payroll_records",
        operation="read",
        timestamp=100.0,
        volume=0.5,
        evidence_timestamp=100.0,
    )

    # 1. High risk (rho=0.9), high sensitivity (sigma=1.0)
    # Charge for ALLOW: kappa * vol * sigma * rho^2 = 10 * 0.5 * 1.0 * 0.81 = 4.05
    # C_t(ALLOW) = 4.05 / 10 = 0.405 > delta_high (0.3)
    # Therefore ALLOW must be filtered out by exposure threshold!
    policy_mask = [1, 1, 1, 1, 1]
    f_set, reasons = shield.compute_feasible_set(
        req=req,
        b_bar=50.0,
        policy_mask=policy_mask,
        risk_score=0.9,
        resource_sensitivity=1.0,
        budget_store=store,
        current_ts=100.0,
    )

    assert Action.ALLOW not in f_set
    assert Action.DENY in f_set

    # Proposing ALLOW must result in shield veto -> DENY
    executed, overridden, reason = shield.arbitrate(Action.ALLOW, f_set, reasons)
    assert executed == Action.DENY
    assert overridden is True
    assert "Shield vetoed" in reason


def test_pep_authorization_enforcement():
    """Verify PEP cryptographic checks: nonces, expiry, policy version, volume limits."""
    pep = PolicyEnforcementPoint(secret_key=SECRET_KEY)
    pep.set_current_policy_version("policy-v1-hash")

    ts = 1000.0
    auth = Authorization(
        request_id="req-123",
        principal="alice",
        resource="src_repo",
        operation="read",
        action=Action.ALLOW,
        permitted_volume=0.10,
        issued_at=ts,
        expires_at=ts + 60.0,
        policy_version="policy-v1-hash",
    ).sign(SECRET_KEY)

    # 1. Valid execution
    ok, status, msg = pep.enforce(auth, actual_volume=0.08, current_ts=ts + 5.0)
    assert ok is True
    assert status == EnforcementAckStatus.ACKED

    # 2. Replay of same token/nonce must fail
    ok_rep, status_rep, _ = pep.enforce(auth, actual_volume=0.08, current_ts=ts + 10.0)
    assert ok_rep is False
    assert status_rep == EnforcementAckStatus.NONCE_REPLAY

    # 3. Expired token
    auth_expired = Authorization(
        request_id="req-exp",
        principal="alice",
        resource="src_repo",
        operation="read",
        action=Action.ALLOW,
        permitted_volume=0.10,
        issued_at=ts,
        expires_at=ts + 60.0,
        policy_version="policy-v1-hash",
    ).sign(SECRET_KEY)
    ok_exp, status_exp, _ = pep.enforce(auth_expired, actual_volume=0.05, current_ts=ts + 65.0)
    assert ok_exp is False
    assert status_exp == EnforcementAckStatus.EXPIRED

    # 4. Stale policy version
    auth_stale = Authorization(
        request_id="req-stale",
        principal="alice",
        resource="src_repo",
        operation="read",
        action=Action.ALLOW,
        permitted_volume=0.10,
        issued_at=ts,
        expires_at=ts + 60.0,
        policy_version="old-stale-hash",
    ).sign(SECRET_KEY)
    ok_stale, status_stale, _ = pep.enforce(auth_stale, actual_volume=0.05, current_ts=ts + 5.0)
    assert ok_stale is False
    assert status_stale == EnforcementAckStatus.STALE_POLICY

    # 5. Volume exceeded
    auth_vol = Authorization(
        request_id="req-vol",
        principal="alice",
        resource="src_repo",
        operation="read",
        action=Action.ALLOW,
        permitted_volume=0.10,
        issued_at=ts,
        expires_at=ts + 60.0,
        policy_version="policy-v1-hash",
    ).sign(SECRET_KEY)
    ok_vol, status_vol, _ = pep.enforce(auth_vol, actual_volume=0.25, current_ts=ts + 5.0)
    assert ok_vol is False
    assert status_vol == EnforcementAckStatus.VOLUME_EXCEEDED

    # 6. Tampered signature
    auth_tampered = Authorization(
        request_id="req-tamp",
        principal="alice",
        resource="src_repo",
        operation="read",
        action=Action.ALLOW,
        permitted_volume=0.10,
        issued_at=ts,
        expires_at=ts + 60.0,
        policy_version="policy-v1-hash",
    ).sign(b"wrong-key")
    ok_tamp, status_tamp, _ = pep.enforce(auth_tampered, actual_volume=0.05, current_ts=ts + 5.0)
    assert ok_tamp is False
    assert status_tamp == EnforcementAckStatus.TAMPERED


@settings(max_examples=50, deadline=None)
@given(
    prop_action=st.sampled_from(list(Action)),
    volume=st.floats(min_value=0.0, max_value=1.0),
    posture=st.floats(min_value=0.0, max_value=1.0),
    risk=st.floats(min_value=0.0, max_value=1.0),
    sensitivity=st.sampled_from([0.2, 0.6, 1.0]),
    evidence_stale=st.booleans(),
)
def test_hypothesis_safety_invariants(prop_action, volume, posture, risk, sensitivity, evidence_stale):
    """Property test: For any random request sequence and any random proposal sequence,

    executed action is ALWAYS in F_t, budget is never negative, and DENY is always available.
    """
    shield = RuntimeShield()
    store = BudgetStore(b_max=100.0)
    engine = PolicyEngine(backend="python")

    cur_ts = 1000.0
    ev_ts = cur_ts - 500.0 if evidence_stale else cur_ts - 10.0

    req = Request(
        principal="hypo_user",
        device="hypo_device",
        resource="src_repo",
        operation="read",
        timestamp=cur_ts,
        volume=volume,
        device_posture=posture,
        evidence_timestamp=ev_ts,
    )

    mask, _, _ = engine.evaluate_mask(req, role="engineering")
    b_info = store.get_budget("hypo_user", cur_ts)
    b_bar = b_info["balance"]

    f_set, reasons = shield.compute_feasible_set(
        req=req,
        b_bar=b_bar,
        policy_mask=mask,
        risk_score=risk,
        resource_sensitivity=sensitivity,
        budget_store=store,
        current_ts=cur_ts,
    )

    # 1. Invariant: DENY is ALWAYS in F_t
    assert int(Action.DENY) in f_set

    # 2. Arbitrate proposal
    executed, overridden, _ = shield.arbitrate(prop_action, f_set, reasons)

    # 3. Invariant: executed action is ALWAYS in F_t
    assert int(executed) in f_set

    # 4. Reserve budget for executed action
    charge = store.compute_charge(executed, req.volume, sensitivity, risk)
    ok, b_before, b_after = store.check_and_reserve(
        req.request_id, "hypo_user", cur_ts, charge
    )

    # 5. Invariant: budget after reservation is never negative
    assert b_after >= 0.0
    assert ok is True  # Because executed action was certified in F_t
