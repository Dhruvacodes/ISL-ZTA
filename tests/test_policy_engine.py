"""Tests for Policy Engine, Rego bundle semantics, and mask construction.

Citations:
- Eq. (8): m_t(a) = 1[P_v(q, x, h, a) = permit]
- Section 3.4: Fail-closed semantics, MFA monotonicity, bundle version hashing
"""

import shutil
import pytest
from pathlib import Path

from ztarb.types import Action, Request
from ztarb.policy_engine import PolicyEngine, PythonPolicyEvaluator, OPAPolicyEvaluator, compute_bundle_hash


def test_platform_fail_closed_and_deny_always_available():
    """Verify DENY is always available even for malformed or unknown roles/resources."""
    engine = PolicyEngine(bundle_dir="policy/bundle_v1", backend="python")
    
    req_unknown = Request(
        principal="intruder",
        device="dev-unknown",
        resource="nonexistent_resource",
        operation="superadmin",
        timestamp=100.0,
    )
    mask, rules, pol_hash = engine.evaluate_mask(req_unknown, role="unregistered_role")
    assert mask[Action.DENY] == 1
    assert mask[Action.ALLOW] == 0


def test_mfa_never_grants_forbidden_resource():
    """CRITICAL INVARIANT: MFA being possible must never make a prohibited resource accessible."""
    engine = PolicyEngine(bundle_dir="policy/bundle_v1", backend="python")
    
    # Role 'finance' is NOT authorized for 'prod_secrets'
    req = Request(
        principal="bob_finance",
        device="fin-laptop",
        resource="prod_secrets",
        operation="read",
        timestamp=200.0,
        mfa_passed=False,
    )
    mask, rules, _ = engine.evaluate_mask(req, role="finance")
    # Neither ALLOW nor MFA can be permitted for a prohibited resource!
    assert mask[Action.ALLOW] == 0
    assert mask[Action.MFA] == 0


def test_role_permissions_and_posture_minimum():
    """Verify role entitlements, posture gates, and mfa requirements."""
    engine = PolicyEngine(bundle_dir="policy/bundle_v1", backend="python")

    # 1. Engineering accessing dev_db with good posture: ALLOW and RESTRICT permitted
    req_good = Request(
        principal="alice_eng",
        device="workstation",
        resource="dev_db",
        operation="read",
        timestamp=300.0,
        device_posture=0.85,  # Engineering min is 0.60
    )
    mask, _, _ = engine.evaluate_mask(req_good, role="engineering")
    assert mask[Action.ALLOW] == 1
    assert mask[Action.RESTRICT] == 1
    assert mask[Action.DENY] == 1

    # 2. Engineering accessing dev_db with low device posture: ALLOW rejected
    req_low_posture = Request(
        principal="alice_eng",
        device="workstation",
        resource="dev_db",
        operation="read",
        timestamp=300.0,
        device_posture=0.40,  # Below 0.60
    )
    mask2, _, _ = engine.evaluate_mask(req_low_posture, role="engineering")
    assert mask2[Action.ALLOW] == 0

    # 3. High sensitivity resource ('payroll_records') for finance: requires MFA
    req_high_sens_no_mfa = Request(
        principal="carol_fin",
        device="fin-laptop",
        resource="payroll_records",
        operation="read",
        timestamp=300.0,
        device_posture=0.90,
        mfa_passed=False,
    )
    mask3, _, _ = engine.evaluate_mask(req_high_sens_no_mfa, role="finance")
    assert mask3[Action.ALLOW] == 0
    assert mask3[Action.MFA] == 1  # MFA challenge offered

    # Once MFA is passed, ALLOW is permitted
    req_high_sens_with_mfa = Request(
        principal="carol_fin",
        device="fin-laptop",
        resource="payroll_records",
        operation="read",
        timestamp=300.0,
        device_posture=0.90,
        mfa_passed=True,
    )
    mask4, _, _ = engine.evaluate_mask(req_high_sens_with_mfa, role="finance")
    assert mask4[Action.ALLOW] == 1


def test_bundle_hash_changes_on_mutation(tmp_path):
    """Mutation test: changing policy bundle contents changes the version hash."""
    bundle_copy = tmp_path / "bundle_v1"
    bundle_copy.mkdir()
    (bundle_copy / "data.json").write_text('{"roles": {}}', encoding="utf-8")
    (bundle_copy / "access.rego").write_text("package test", encoding="utf-8")

    h1 = compute_bundle_hash(bundle_copy)
    
    # Mutate data.json
    (bundle_copy / "data.json").write_text('{"roles": {"admin": {}}}', encoding="utf-8")
    h2 = compute_bundle_hash(bundle_copy)

    assert h1 != h2, "Policy version hash must change when bundle is mutated"


@pytest.mark.skipif(shutil.which("opa") is None, reason="OPA binary not present on system PATH")
def test_opa_and_python_parity():
    """Verify Python evaluator and OPA binary give identical masks on a generated test suite."""
    py_eval = PythonPolicyEvaluator("policy/bundle_v1")
    opa_eval = OPAPolicyEvaluator("policy/bundle_v1")

    test_cases = [
        (Request(principal="u1", device="d1", resource="src_repo", operation="read", timestamp=10.0, device_posture=0.8), "engineering"),
        (Request(principal="u2", device="d2", resource="src_repo", operation="write", timestamp=10.0, device_posture=0.4), "engineering"),
        (Request(principal="u3", device="d3", resource="payroll_records", operation="read", timestamp=10.0, device_posture=0.9, mfa_passed=False), "finance"),
        (Request(principal="u4", device="d4", resource="payroll_records", operation="read", timestamp=10.0, device_posture=0.9, mfa_passed=True), "finance"),
        (Request(principal="u5", device="d5", resource="dev_db", operation="export", timestamp=10.0, device_posture=0.2, auth_failures_session=4), "support"),
    ]

    for req, role in test_cases:
        py_mask, _ = py_eval.evaluate(req, role)
        opa_mask, _ = opa_eval.evaluate(req, role)
        assert py_mask == opa_mask, f"Parity mismatch for req {req} and role {role}: Python={py_mask}, OPA={opa_mask}"
