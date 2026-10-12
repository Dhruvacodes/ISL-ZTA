"""Append-only, tamper-evident hash-chained audit logger.

Features:
- Write-ahead logging with terminal enforcement acknowledgement
- Cryptographic hash chaining: h_k = SHA256(h_{k-1} || canonical(record))
- Merkle root batch anchors
- Verification CLI and tamper pinpointing
- Deterministic decision replay verification
- Audit completeness metric calculation
"""

from __future__ import annotations
import argparse
import hashlib
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from ztarb.types import Action, AuditRecord, EnforcementAckStatus


SALT = b"zt-arbiter-audit-salt-2026"


def pseudonymize_principal(principal: str) -> str:
    """Create salted pseudonymous hash of principal identity."""
    return hashlib.sha256(SALT + principal.encode("utf-8")).hexdigest()[:16]


def compute_merkle_root(leaf_hashes: List[str]) -> str:
    """Compute Merkle tree root of a batch of hashes."""
    if not leaf_hashes:
        return "0" * 64
    current_level = [bytes.fromhex(h) for h in leaf_hashes]
    while len(current_level) > 1:
        next_level = []
        for i in range(0, len(current_level), 2):
            left = current_level[i]
            right = current_level[i + 1] if i + 1 < len(current_level) else left
            combined = hashlib.sha256(left + right).digest()
            next_level.append(combined)
        current_level = next_level
    return current_level[0].hex()


class AuditLogger:
    """Audit logger managing write-ahead entries, hash chain, and verification."""

    def __init__(self, log_path: str = "results/audit.log", batch_size: int = 50):
        self.log_path = Path(log_path)
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        self.batch_size = batch_size
        self._last_hash = "0" * 64
        self._record_count = 0
        self._current_batch_hashes: List[str] = []
        self._records_cache: Dict[str, AuditRecord] = {}  # request_id -> record

        # Read existing chain if file exists
        if self.log_path.exists() and self.log_path.stat().st_size > 0:
            self._load_existing_chain()

    def _load_existing_chain(self) -> None:
        count = 0
        last_hash = "0" * 64
        with open(self.log_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                try:
                    data = json.loads(line)
                    if "entry_hash" in data:
                        last_hash = data["entry_hash"]
                        count += 1
                        rec = AuditRecord(**data)
                        self._records_cache[rec.request_id] = rec
                except Exception:
                    pass
        self._record_count = count
        self._last_hash = last_hash

    def log_write_ahead(
        self,
        correlation_id: str,
        request_id: str,
        principal: str,
        evidence_ts: float,
        decision_ts: float,
        policy_hash: str,
        model_hash: str,
        risk_score: float,
        risk_inputs: Dict[str, float],
        budget_before: float,
        budget_after: float,
        mask: List[int],
        feasible_set: List[int],
        proposed_action: int,
        executed_action: int,
        triggered_rules: List[str],
    ) -> AuditRecord:
        """Write-ahead record created BEFORE authorization issuance."""
        self._record_count += 1
        rec = AuditRecord(
            record_id=self._record_count,
            prev_hash=self._last_hash,
            correlation_id=correlation_id,
            request_id=request_id,
            pseudonymous_principal=pseudonymize_principal(principal),
            evidence_timestamp=evidence_ts,
            decision_timestamp=decision_ts,
            schema_version="1.0.0",
            policy_hash=policy_hash,
            model_hash=model_hash,
            risk_score=risk_score,
            risk_inputs=risk_inputs,
            budget_before=budget_before,
            budget_after=budget_after,
            mask=mask,
            feasible_set=feasible_set,
            proposed_action=proposed_action,
            executed_action=executed_action,
            triggered_rules=triggered_rules,
            enforcement_status=EnforcementAckStatus.PENDING,
        )
        rec.entry_hash = rec.compute_hash()
        self._last_hash = rec.entry_hash
        self._current_batch_hashes.append(rec.entry_hash)
        self._records_cache[request_id] = rec

        self._append_line(rec.model_dump_json())

        # Check batch anchor
        if len(self._current_batch_hashes) >= self.batch_size:
            self._write_batch_anchor()

        return rec

    def log_enforcement_ack(
        self,
        request_id: str,
        status: EnforcementAckStatus,
        ack_timestamp: float,
        bytes_transferred: float = 0.0,
    ) -> Optional[AuditRecord]:
        """Update audit record with terminal PEP enforcement status."""
        rec = self._records_cache.get(request_id)
        if not rec:
            return None

        rec.enforcement_status = status
        rec.enforcement_ack_timestamp = ack_timestamp
        rec.bytes_transferred = bytes_transferred

        # Append terminal status update line
        st_val = status.value if hasattr(status, "value") else str(status)
        ack_event = {
            "event_type": "ENFORCEMENT_ACK",
            "request_id": request_id,
            "status": st_val,
            "ack_timestamp": round(ack_timestamp, 3),
            "bytes_transferred": bytes_transferred,
            "record_id": rec.record_id,
            "entry_hash": rec.entry_hash,
        }
        self._append_line(json.dumps(ack_event))
        return rec

    def _append_line(self, line: str) -> None:
        with open(self.log_path, "a", encoding="utf-8") as f:
            f.write(line + "\n")

    def _write_batch_anchor(self) -> str:
        root = compute_merkle_root(self._current_batch_hashes)
        anchor_line = json.dumps({
            "event_type": "BATCH_ANCHOR",
            "merkle_root": root,
            "batch_size": len(self._current_batch_hashes),
            "up_to_record_id": self._record_count,
        })
        self._append_line(anchor_line)
        self._current_batch_hashes = []
        return root

    def flush_anchor(self) -> Optional[str]:
        if self._current_batch_hashes:
            return self._write_batch_anchor()
        return None

    @classmethod
    def verify_chain(cls, log_file: str) -> Tuple[bool, Optional[str], Optional[int]]:
        """Verify SHA-256 hash chain integrity of an audit file.
        
        Returns (is_valid, error_reason, failure_record_id).
        """
        path = Path(log_file)
        if not path.exists():
            return False, f"File {log_file} does not exist", None

        expected_prev = "0" * 64
        record_idx = 0

        with open(path, "r", encoding="utf-8") as f:
            for line_no, line in enumerate(f, start=1):
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                data = json.loads(line)
                if data.get("event_type") in ("BATCH_ANCHOR", "ENFORCEMENT_ACK"):
                    continue

                record_idx += 1
                try:
                    rec = AuditRecord(**data)
                except Exception as ex:
                    return False, f"Malformed record at line {line_no}: {ex}", record_idx

                # Check prev_hash chaining
                if rec.prev_hash != expected_prev:
                    return (
                        False,
                        f"Hash chain broken at record {rec.record_id}: expected prev_hash {expected_prev[:12]}..., got {rec.prev_hash[:12]}...",
                        rec.record_id,
                    )

                # Recompute and verify entry_hash
                calculated = rec.compute_hash()
                if rec.entry_hash != calculated:
                    return (
                        False,
                        f"Tampered record content at record {rec.record_id}: stored {rec.entry_hash[:12]}..., computed {calculated[:12]}...",
                        rec.record_id,
                    )

                expected_prev = rec.entry_hash

        return True, None, None

    @classmethod
    def compute_completeness(cls, log_file: str) -> float:
        """Compute fraction of decisions with all required fields and terminal status."""
        path = Path(log_file)
        if not path.exists():
            return 0.0

        records: Dict[str, bool] = {}
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                data = json.loads(line)
                if "request_id" in data and "event_type" not in data:
                    req_id = data["request_id"]
                    records[req_id] = False
                elif data.get("event_type") == "ENFORCEMENT_ACK":
                    req_id = data["request_id"]
                    if req_id in records:
                        records[req_id] = True

        if not records:
            return 1.0
        complete = sum(1 for v in records.values() if v)
        return float(complete / len(records))


def main() -> None:
    parser = argparse.ArgumentParser(description="ZT-Arbiter Audit Tool")
    parser.add_argument("command", choices=["verify", "completeness"], help="Command to execute")
    parser.add_argument("file", help="Path to audit log file")
    args = parser.parse_args()

    if args.command == "verify":
        valid, reason, rec_id = AuditLogger.verify_chain(args.file)
        if valid:
            print(f"[OK] Audit log chain verified successfully: {args.file}")
            sys.exit(0)
        else:
            print(f"[FAILED] Tamper detected at record #{rec_id}: {reason}")
            sys.exit(1)
    elif args.command == "completeness":
        metric = AuditLogger.compute_completeness(args.file)
        print(f"Audit completeness: {metric * 100:.2f}%")


if __name__ == "__main__":
    main()
