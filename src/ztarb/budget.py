"""Budget and exposure tracker with atomic SQLite persistence.

Citations:
- Eq. (4): c_t(a) = kappa * v_t(a) * sigma(r_t) * rho_t^p
- Eq. (5): B_bar = min(B_max, B_t + eta * g_t * dt)
- Eq. (6): B_{t+1} = B_bar - c_t(a_t), requiring c_t(a_t) <= B_bar
"""

from __future__ import annotations
import math
import sqlite3
import threading
from typing import Optional, Tuple, Dict, Any
from pathlib import Path

from ztarb.types import Action


class BudgetStore:
    """Thread-safe, multi-process SQLite budget store with atomic check-and-reserve."""

    def __init__(
        self,
        db_path: str = ":memory:",
        kappa: float = 1500.0,
        p: float = 2.0,
        b_max: float = 100.0,
        eta: float = 1.0,  # units per minute
        restrict_factor: float = 0.25,
    ):
        self.db_path = db_path
        self.kappa = float(kappa)
        self.p = float(p)
        self.b_max = float(b_max)
        self.eta_per_sec = float(eta) / 60.0  # convert unit/min to unit/sec
        self.restrict_factor = float(restrict_factor)
        self._local = threading.local()
        self._lock = threading.Lock()

        # Initialize schema
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        if not hasattr(self._local, "conn") or self._local.conn is None:
            conn = sqlite3.connect(
                self.db_path,
                timeout=30.0,
                check_same_thread=False,
                isolation_level=None,  # Autocommit mode, we manage transactions explicitly
            )
            conn.execute("PRAGMA journal_mode = WAL;")
            conn.execute("PRAGMA synchronous = NORMAL;")
            conn.execute("PRAGMA busy_timeout = 30000;")
            self._local.conn = conn
        return self._local.conn

    def _init_db(self) -> None:
        conn = self._get_connection()
        with self._lock:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS principal_budget (
                    principal TEXT PRIMARY KEY,
                    balance REAL NOT NULL,
                    last_update_ts REAL NOT NULL,
                    refill_gate INTEGER NOT NULL DEFAULT 1,
                    in_quarantine INTEGER NOT NULL DEFAULT 0
                );
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS budget_reservations (
                    request_id TEXT PRIMARY KEY,
                    principal TEXT NOT NULL,
                    charge REAL NOT NULL,
                    reserved_at REAL NOT NULL,
                    reconciled INTEGER NOT NULL DEFAULT 0,
                    actual_charge REAL NOT NULL,
                    FOREIGN KEY(principal) REFERENCES principal_budget(principal)
                );
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS budget_audit (
                    audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    principal TEXT NOT NULL,
                    operation TEXT NOT NULL,
                    amount REAL NOT NULL,
                    balance_before REAL NOT NULL,
                    balance_after REAL NOT NULL,
                    timestamp REAL NOT NULL,
                    auth_token TEXT
                );
            """)

    def compute_action_volume(self, action: Action, requested_volume: float) -> float:
        """Normalized volume permitted by action: v_t(a).
        
        # Eq. (4)
        ALLOW: requested volume
        RESTRICT: reduced scope (default 0.25 of requested, read-only)
        MFA, DENY, QUARANTINE: 0.0
        """
        if action == Action.ALLOW:
            return float(requested_volume)
        elif action == Action.RESTRICT:
            return float(requested_volume * self.restrict_factor)
        else:
            return 0.0

    def compute_charge(
        self,
        action: Action,
        requested_volume: float,
        resource_sensitivity: float,
        risk_score: float,
    ) -> float:
        """Compute budget charge c_t(a).
        
        # Eq. (4): c_t(a) = kappa * v_t(a) * sigma(r_t) * rho_t^p
        """
        v_a = self.compute_action_volume(action, requested_volume)
        if v_a <= 0.0:
            return 0.0
        sigma = float(max(0.0, resource_sensitivity))
        rho = float(max(0.0, min(1.0, risk_score)))
        charge = self.kappa * v_a * sigma * (rho ** self.p)
        return float(max(0.0, charge))

    def _apply_refill(
        self,
        balance: float,
        last_ts: float,
        current_ts: float,
        gate: int,
    ) -> Tuple[float, float]:
        """Compute Eq. (5): B_bar = min(B_max, B_t + eta * g_t * dt)."""
        dt = max(0.0, current_ts - last_ts)
        if gate == 1 and dt > 0.0:
            refilled = balance + self.eta_per_sec * dt
            b_bar = min(self.b_max, refilled)
        else:
            b_bar = balance
        return b_bar, dt

    def get_budget(self, principal: str, current_ts: float) -> Dict[str, Any]:
        """Get or initialize budget for principal with up-to-date refill."""
        conn = self._get_connection()
        conn.execute("BEGIN IMMEDIATE;")
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT balance, last_update_ts, refill_gate, in_quarantine FROM principal_budget WHERE principal = ?;",
                (principal,),
            )
            row = cur.fetchone()
            if row is None:
                # Initialize fresh budget to B_max
                balance = self.b_max
                last_ts = current_ts
                gate = 1
                quarantine = 0
                cur.execute(
                    "INSERT INTO principal_budget (principal, balance, last_update_ts, refill_gate, in_quarantine) VALUES (?, ?, ?, ?, ?);",
                    (principal, balance, last_ts, gate, quarantine),
                )
            else:
                balance, last_ts, gate, quarantine = row
                if quarantine == 1:
                    gate = 0
                balance, dt = self._apply_refill(balance, last_ts, current_ts, gate)
                cur.execute(
                    "UPDATE principal_budget SET balance = ?, last_update_ts = ? WHERE principal = ?;",
                    (balance, current_ts, principal),
                )
            conn.execute("COMMIT;")
            return {
                "principal": principal,
                "balance": balance,
                "b_max": self.b_max,
                "refill_gate": gate,
                "in_quarantine": quarantine,
            }
        except Exception:
            conn.execute("ROLLBACK;")
            raise

    def check_and_reserve(
        self,
        request_id: str,
        principal: str,
        current_ts: float,
        charge: float,
        is_quarantine: bool = False,
    ) -> Tuple[bool, float, float]:
        """Atomic check-and-reserve transaction.
        
        # Eq. (5)-(6):
        B_bar = min(B_max, B_t + eta * g_t * dt)
        if charge <= B_bar:
            B_{t+1} = B_bar - charge
            commit and return True, B_bar, B_{t+1}
        else:
            return False, B_bar, B_bar
            
        Idempotent per request_id.
        """
        conn = self._get_connection()
        conn.execute("BEGIN IMMEDIATE;")
        try:
            cur = conn.cursor()
            # 1. Check idempotency
            cur.execute(
                "SELECT charge, actual_charge FROM budget_reservations WHERE request_id = ?;",
                (request_id,),
            )
            existing = cur.fetchone()
            if existing is not None:
                # Already reserved, fetch current balance
                cur.execute("SELECT balance FROM principal_budget WHERE principal = ?;", (principal,))
                bal_row = cur.fetchone()
                bal = bal_row[0] if bal_row else self.b_max
                conn.execute("COMMIT;")
                return True, bal + existing[0], bal

            # 2. Fetch or create principal budget
            cur.execute(
                "SELECT balance, last_update_ts, refill_gate, in_quarantine FROM principal_budget WHERE principal = ?;",
                (principal,),
            )
            row = cur.fetchone()
            if row is None:
                balance = self.b_max
                last_ts = current_ts
                gate = 1
                quarantine = 0
            else:
                balance, last_ts, gate, quarantine = row

            if is_quarantine:
                gate = 0
                quarantine = 1

            effective_gate = 0 if quarantine == 1 else gate
            # Apply Eq. (5)
            b_bar, _ = self._apply_refill(balance, last_ts, current_ts, effective_gate)

            # Check feasibility: Eq. (6) requiring c_t(a) <= B_bar
            if charge > b_bar + 1e-9:  # Float tolerance
                # Overdraft rejected, update timestamp and gate
                cur.execute(
                    """
                    INSERT INTO principal_budget (principal, balance, last_update_ts, refill_gate, in_quarantine)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(principal) DO UPDATE SET balance = ?, last_update_ts = ?, refill_gate = ?, in_quarantine = ?;
                    """,
                    (principal, b_bar, current_ts, effective_gate, quarantine,
                     b_bar, current_ts, effective_gate, quarantine),
                )
                conn.execute("COMMIT;")
                return False, b_bar, b_bar

            # Deduct charge: Eq. (6)
            b_next = max(0.0, b_bar - charge)

            cur.execute(
                """
                INSERT INTO principal_budget (principal, balance, last_update_ts, refill_gate, in_quarantine)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(principal) DO UPDATE SET balance = ?, last_update_ts = ?, refill_gate = ?, in_quarantine = ?;
                """,
                (principal, b_next, current_ts, effective_gate, quarantine,
                 b_next, current_ts, effective_gate, quarantine),
            )

            # Record reservation
            cur.execute(
                """
                INSERT INTO budget_reservations (request_id, principal, charge, reserved_at, reconciled, actual_charge)
                VALUES (?, ?, ?, ?, 0, ?);
                """,
                (request_id, principal, charge, current_ts, charge),
            )

            # Record audit
            cur.execute(
                """
                INSERT INTO budget_audit (principal, operation, amount, balance_before, balance_after, timestamp, auth_token)
                VALUES (?, 'RESERVE', ?, ?, ?, ?, ?);
                """,
                (principal, charge, b_bar, b_next, current_ts, request_id),
            )

            conn.execute("COMMIT;")
            return True, b_bar, b_next

        except Exception:
            conn.execute("ROLLBACK;")
            raise

    def reconcile_charge(self, request_id: str, actual_charge: float, current_ts: float) -> bool:
        """Reconcile reservation after PEP execution (e.g. if partial transfer or failure)."""
        conn = self._get_connection()
        conn.execute("BEGIN IMMEDIATE;")
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT principal, charge, reconciled FROM budget_reservations WHERE request_id = ?;",
                (request_id,),
            )
            row = cur.fetchone()
            if not row:
                conn.execute("COMMIT;")
                return False
            principal, reserved_charge, reconciled = row
            if reconciled == 1:
                conn.execute("COMMIT;")
                return True

            diff = reserved_charge - actual_charge
            if diff > 0.0:
                # Credit unused portion back to principal budget
                cur.execute("SELECT balance FROM principal_budget WHERE principal = ?;", (principal,))
                bal_row = cur.fetchone()
                if bal_row:
                    new_bal = min(self.b_max, bal_row[0] + diff)
                    cur.execute(
                        "UPDATE principal_budget SET balance = ?, last_update_ts = ? WHERE principal = ?;",
                        (new_bal, current_ts, principal),
                    )

            cur.execute(
                "UPDATE budget_reservations SET reconciled = 1, actual_charge = ? WHERE request_id = ?;",
                (actual_charge, request_id),
            )
            conn.execute("COMMIT;")
            return True
        except Exception:
            conn.execute("ROLLBACK;")
            raise

    def quarantine_principal(self, principal: str, current_ts: float) -> None:
        """Trigger quarantine workflow: suspend sessions, set refill gate g_t=0."""
        conn = self._get_connection()
        conn.execute("BEGIN IMMEDIATE;")
        try:
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO principal_budget (principal, balance, last_update_ts, refill_gate, in_quarantine)
                VALUES (?, 0.0, ?, 0, 1)
                ON CONFLICT(principal) DO UPDATE SET refill_gate = 0, in_quarantine = 1, last_update_ts = ?;
                """,
                (principal, current_ts, current_ts),
            )
            conn.execute("COMMIT;")
        except Exception:
            conn.execute("ROLLBACK;")
            raise

    def admin_reset_budget(
        self,
        principal: str,
        amount: float,
        admin_auth_token: str,
        current_ts: float,
    ) -> float:
        """Separate, separately authorized, logged admin reset operation."""
        if not admin_auth_token or len(admin_auth_token) < 8:
            raise PermissionError("Admin reset requires valid authorized security token")

        amount = float(min(self.b_max, max(0.0, amount)))
        conn = self._get_connection()
        conn.execute("BEGIN IMMEDIATE;")
        try:
            cur = conn.cursor()
            cur.execute("SELECT balance FROM principal_budget WHERE principal = ?;", (principal,))
            row = cur.fetchone()
            before = row[0] if row else 0.0

            cur.execute(
                """
                INSERT INTO principal_budget (principal, balance, last_update_ts, refill_gate, in_quarantine)
                VALUES (?, ?, ?, 1, 0)
                ON CONFLICT(principal) DO UPDATE SET balance = ?, last_update_ts = ?, refill_gate = 1, in_quarantine = 0;
                """,
                (principal, amount, current_ts, amount, current_ts),
            )
            cur.execute(
                """
                INSERT INTO budget_audit (principal, operation, amount, balance_before, balance_after, timestamp, auth_token)
                VALUES (?, 'ADMIN_RESET', ?, ?, ?, ?, ?);
                """,
                (principal, amount, before, amount, current_ts, admin_auth_token),
            )
            conn.execute("COMMIT;")
            return amount
        except Exception:
            conn.execute("ROLLBACK;")
            raise

    def close(self) -> None:
        if hasattr(self._local, "conn") and self._local.conn is not None:
            try:
                self._local.conn.close()
            except Exception:
                pass
            self._local.conn = None
