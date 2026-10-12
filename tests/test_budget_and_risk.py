"""Unit and concurrency tests for Budget, Risk, and Audit log.

Citations:
- Eq. (3): Risk scoring
- Eq. (4)-(6): Budget calculations and atomic SQLite store
"""

import concurrent.futures
import json
import os
import tempfile
import time
import pytest
from hypothesis import given, strategies as st

from ztarb.types import Action, Request, EnforcementAckStatus
from ztarb.risk import RiskEstimator
from ztarb.budget import BudgetStore
from ztarb.audit import AuditLogger


def test_risk_estimator_weights_and_bounds():
    """Verify Eq. (3): rho in [0, 1] and monotonic response."""
    estimator = RiskEstimator()
    req = Request(
        principal="alice",
        device="laptop-1",
        resource="src_repo",
        operation="read",
        timestamp=1000.0,
        volume=0.02,
        device_posture=0.95,
        auth_failures_session=0,
        unresolved_alerts=0,
    )
    rho_low, _ = estimator.compute_risk(req)
    assert 0.0 <= rho_low <= 1.0

    # High anomaly request
    req_bad = Request(
        principal="alice",
        device="unknown-rogue",
        resource="src_repo",
        operation="read",
        timestamp=1000.0,
        volume=0.5,
        device_posture=0.1,
        auth_failures_session=5,
        unresolved_alerts=3,
    )
    rho_high, _ = estimator.compute_risk(req_bad, known_devices=["laptop-1"])
    assert 0.0 <= rho_high <= 1.0
    assert rho_high > rho_low


def test_budget_charge_monotonicity():
    """Verify Eq. (4): c_t(a) is monotonic in rho, p, sigma, v."""
    store = BudgetStore()
    
    # 1. Monotonic in rho
    c1 = store.compute_charge(Action.ALLOW, requested_volume=0.1, resource_sensitivity=0.6, risk_score=0.2)
    c2 = store.compute_charge(Action.ALLOW, requested_volume=0.1, resource_sensitivity=0.6, risk_score=0.8)
    assert c2 > c1

    # 2. Monotonic in sigma (sensitivity)
    c_low_sig = store.compute_charge(Action.ALLOW, requested_volume=0.1, resource_sensitivity=0.2, risk_score=0.5)
    c_high_sig = store.compute_charge(Action.ALLOW, requested_volume=0.1, resource_sensitivity=1.0, risk_score=0.5)
    assert c_high_sig > c_low_sig

    # 3. Monotonic in volume
    c_vol1 = store.compute_charge(Action.ALLOW, requested_volume=0.05, resource_sensitivity=0.6, risk_score=0.5)
    c_vol2 = store.compute_charge(Action.ALLOW, requested_volume=0.20, resource_sensitivity=0.6, risk_score=0.5)
    assert c_vol2 > c_vol1

    # 4. Zero volume for non-data actions
    assert store.compute_charge(Action.DENY, 0.5, 1.0, 0.9) == 0.0
    assert store.compute_charge(Action.MFA, 0.5, 1.0, 0.9) == 0.0
    assert store.compute_charge(Action.QUARANTINE, 0.5, 1.0, 0.9) == 0.0

    # 5. RESTRICT has reduced volume factor (0.25)
    c_allow = store.compute_charge(Action.ALLOW, 0.1, 0.6, 0.5)
    c_restrict = store.compute_charge(Action.RESTRICT, 0.1, 0.6, 0.5)
    assert abs(c_restrict - 0.25 * c_allow) < 1e-6


def test_exact_budget_boundary_and_refill_gate():
    """Verify Eq. (5)-(6): exact boundary (c == B_bar allowed, c > B_bar denied), refill gate."""
    store = BudgetStore(kappa=10.0, p=2.0, b_max=100.0, eta=60.0)  # eta = 60/min = 1/sec
    ts = 1000.0

    # Initial balance is 100.0
    # Reserve exactly 100.0
    ok, b_before, b_after = store.check_and_reserve("req-1", "user1", ts, charge=100.0)
    assert ok is True
    assert b_before == 100.0
    assert b_after == 0.0

    # Immediate next charge of 0.01 must be denied
    ok2, b_before2, b_after2 = store.check_and_reserve("req-2", "user1", ts, charge=0.01)
    assert ok2 is False
    assert b_before2 == 0.0
    assert b_after2 == 0.0

    # Advance clock by 10 seconds with gate=1 -> refills 10 units
    ok3, b_before3, b_after3 = store.check_and_reserve("req-3", "user1", ts + 10.0, charge=10.0)
    assert ok3 is True
    assert abs(b_before3 - 10.0) < 1e-4
    assert abs(b_after3 - 0.0) < 1e-4

    # Idempotent repeated request_id: cannot double charge
    ok_repeat, b_bef_rep, b_aft_rep = store.check_and_reserve("req-3", "user1", ts + 10.0, charge=10.0)
    assert ok_repeat is True
    assert abs(b_aft_rep - 0.0) < 1e-4

    # Quarantine halts refill
    store.quarantine_principal("user1", ts + 10.0)
    # Advance clock by 60 seconds: balance must stay 0 because gate is 0
    b_info = store.get_budget("user1", ts + 70.0)
    assert b_info["balance"] == 0.0
    assert b_info["refill_gate"] == 0


def test_concurrency_no_overdraft_and_idempotency():
    """Requirement: 200 concurrent threads hitting one principal's budget can NEVER overspend,

    and a repeated request_id is charged once.
    """
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name

    try:
        store = BudgetStore(db_path=db_path, b_max=50.0, eta=0.0)  # No refill during test
        principal = "concurrent_victim"
        # Seed budget
        store.get_budget(principal, current_ts=0.0)

        # 200 threads, each attempting to reserve 1.0 unit
        num_threads = 200
        charge_per_req = 1.0

        def attempt_reservation(idx: int):
            # Create a dedicated store instance for each thread hitting the SQLite file
            t_store = BudgetStore(db_path=db_path, b_max=50.0, eta=0.0)
            req_id = f"conc-req-{idx}"
            success, b_before, b_after = t_store.check_and_reserve(
                req_id, principal, current_ts=10.0, charge=charge_per_req
            )
            return success

        with concurrent.futures.ThreadPoolExecutor(max_workers=30) as executor:
            results = list(executor.map(attempt_reservation, range(num_threads)))

        successful_charges = sum(1 for r in results if r)
        # Starting budget was 50.0, charge is 1.0 each, so exactly 50 can succeed, never more!
        assert successful_charges == 50

        # Verify final budget in DB
        final_info = store.get_budget(principal, current_ts=10.0)
        assert abs(final_info["balance"] - 0.0) < 1e-6
        assert final_info["balance"] >= 0.0, "Budget must never be negative!"

        # Find the request_id that was successfully reserved
        succ_idx = results.index(True)
        successful_req_id = f"conc-req-{succ_idx}"

        # Now test idempotency under concurrency with 50 threads repeating the SAME successfully reserved request_id
        def repeat_same_req(idx: int):
            t_store = BudgetStore(db_path=db_path, b_max=50.0, eta=0.0)
            success, b_bef, b_aft = t_store.check_and_reserve(
                successful_req_id, principal, current_ts=10.0, charge=charge_per_req
            )
            return success

        with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
            repeat_results = list(executor.map(repeat_same_req, range(50)))

        # All repeated attempts for the reserved request must return True (idempotent success)
        assert all(repeat_results)
        # Budget must still be 0.0 (not double charged)
        assert abs(store.get_budget(principal, current_ts=10.0)["balance"] - 0.0) < 1e-6

    finally:
        if os.path.exists(db_path):
            try:
                os.remove(db_path)
            except Exception:
                pass


def test_audit_hash_chain_tamper_detection():
    """Verify audit logger append-only hash chain and tamper detection."""
    with tempfile.NamedTemporaryFile(suffix=".log", delete=False) as f:
        log_path = f.name

    try:
        logger = AuditLogger(log_path=log_path, batch_size=5)

        for i in range(12):
            logger.log_write_ahead(
                correlation_id=f"corr-{i}",
                request_id=f"req-{i}",
                principal=f"user-{i % 3}",
                evidence_ts=100.0 + i,
                decision_ts=101.0 + i,
                policy_hash="pol-v1-hash",
                model_hash="ppo-hash",
                risk_score=0.15 * (i % 5),
                risk_inputs={"auth": 0.1},
                budget_before=100.0,
                budget_after=95.0,
                mask=[1, 1, 1, 1, 0],
                feasible_set=[0, 1, 2, 3],
                proposed_action=int(Action.ALLOW),
                executed_action=int(Action.ALLOW),
                triggered_rules=["rule_allow_read"],
            )
            logger.log_enforcement_ack(
                request_id=f"req-{i}",
                status=EnforcementAckStatus.ACKED,
                ack_timestamp=102.0 + i,
                bytes_transferred=0.01,
            )

        logger.flush_anchor()

        # 1. Unmodified chain must pass
        valid, err, rec_id = AuditLogger.verify_chain(log_path)
        assert valid is True
        assert err is None
        assert rec_id is None

        # Completeness should be 1.0 (all acked)
        comp = AuditLogger.compute_completeness(log_path)
        assert comp == 1.0

        # 2. Tamper test: modify one line in the middle
        lines = []
        with open(log_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        # Find line 4 data record and modify content
        target_idx = -1
        for idx, line in enumerate(lines):
            if '"record_id":4' in line or '"record_id": 4' in line:
                target_idx = idx
                break
        assert target_idx != -1

        parsed = json.loads(lines[target_idx])
        parsed["budget_after"] = 999.0
        lines[target_idx] = json.dumps(parsed) + "\n"

        with open(log_path, "w", encoding="utf-8") as f:
            f.writelines(lines)

        # Verification must now fail and pinpoint record #4
        valid_tampered, err_msg, failed_rec = AuditLogger.verify_chain(log_path)
        assert valid_tampered is False
        assert failed_rec == 4
        assert "Tampered" in err_msg or "Hash chain broken" in err_msg

    finally:
        if os.path.exists(log_path):
            try:
                os.remove(log_path)
            except Exception:
                pass
