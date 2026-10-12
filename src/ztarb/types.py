"""Types and schema models for the Zero-Trust Arbiter framework.

Citations:
- Eq. (1): Request q_t = (u_t, d_t, r_t, o_t, tau_t, nu_t)
- Eq. (7): Action space A = {ALLOW, MFA, RESTRICT, DENY, QUARANTINE}
- Eq. (11): Authorization binding & selection
"""

from __future__ import annotations
from enum import IntEnum, Enum
import hashlib
import hmac
import json
import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class Action(IntEnum):
    """Permitted arbitration actions.
    
    # Eq. (7)
    ALLOW: Execute requested operation within bounded scope.
    MFA: Withhold access, challenge; on success creates new re-evaluated request.
    RESTRICT: Execute with predefined reduced scope (e.g. read-only, 0.25 volume).
    DENY: Reject request immediately.
    QUARANTINE: Reject request, terminate active sessions, halt budget refill (g=0).
    """
    ALLOW = 0
    MFA = 1
    RESTRICT = 2
    DENY = 3
    QUARANTINE = 4

    @classmethod
    def from_str(cls, name: str) -> "Action":
        mapping = {
            "ALLOW": cls.ALLOW,
            "MFA": cls.MFA,
            "RESTRICT": cls.RESTRICT,
            "DENY": cls.DENY,
            "QUARANTINE": cls.QUARANTINE,
        }
        upper = name.strip().upper()
        if upper not in mapping:
            raise ValueError(f"Unknown action: {name}")
        return mapping[upper]

    @property
    def label(self) -> str:
        return self.name


class EnforcementAckStatus(str, Enum):
    """Terminal enforcement acknowledgement status from PEP."""
    PENDING = "PENDING"
    ACKED = "ACKED"
    REJECTED_PEP = "REJECTED_PEP"
    EXPIRED = "EXPIRED"
    STALE_POLICY = "STALE_POLICY"
    NONCE_REPLAY = "NONCE_REPLAY"
    VOLUME_EXCEEDED = "VOLUME_EXCEEDED"
    TAMPERED = "TAMPERED"


class Request(BaseModel):
    """Zero-Trust Access Request q_t.
    
    # Eq. (1): q_t = (u_t, d_t, r_t, o_t, tau_t, nu_t)
    - u_t: principal
    - d_t: device
    - r_t: resource
    - o_t: operation
    - tau_t: timestamp
    - nu_t: requested volume normalized to [0, 1]
    """
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    principal: str = Field(description="u_t: Principal identity")
    device: str = Field(description="d_t: Device identifier")
    resource: str = Field(description="r_t: Target resource identifier")
    operation: str = Field(default="read", description="o_t: Operation name (e.g. read, write, export)")
    timestamp: float = Field(description="tau_t: Request timestamp in seconds")
    volume: float = Field(default=0.01, ge=0.0, le=1.0, description="nu_t: Normalized volume in [0, 1]")
    
    # Telemetry and contextual attributes
    session_id: str = Field(default="sess-default")
    device_posture: float = Field(default=0.9, ge=0.0, le=1.0, description="Device hygiene/posture score")
    auth_failures_session: int = Field(default=0, ge=0, description="Auth failure count in current session")
    mfa_passed: bool = Field(default=False, description="Whether stepped-up MFA was recently completed")
    evidence_timestamp: float = Field(default=0.0, description="Timestamp when device/auth evidence was collected")
    unresolved_alerts: int = Field(default=0, ge=0, description="Count of historical unresolved security alerts")
    
    # GROUND TRUTH METADATA - FOR REWARDS AND METRICS ONLY!
    # MUST NEVER BE ACCESSIBLE TO THE OBSERVATION BUILDER OR RL POLICY (asserted by unit tests)
    ground_truth_is_attack: bool = Field(default=False, exclude=False)
    ground_truth_family: Optional[str] = Field(default=None, exclude=False)
    ground_truth_target_volume: float = Field(default=0.0, exclude=False)

    model_config = {"frozen": False}


class Decision(BaseModel):
    """Arbitration decision output by shield and arbiter."""
    request_id: str
    principal: str
    resource: str
    operation: str
    timestamp: float
    
    # Actions
    proposed_action: Action
    executed_action: Action
    shield_overridden: bool = False
    shield_reason: Optional[str] = None
    
    # Feasibility and mask
    policy_mask: List[int] = Field(description="m_t binary mask for 5 actions, # Eq. (8)")
    feasible_set: List[int] = Field(description="F_t feasible action indices, # Eq. (10)")
    
    # Risk and Budget
    risk_score: float = Field(ge=0.0, le=1.0, description="rho_t, # Eq. (3)")
    budget_before: float
    budget_after: float
    charge: float = Field(ge=0.0, description="c_t(a_t), # Eq. (4)")
    
    policy_version: str
    model_version: str = "ppo-v1"


class Authorization(BaseModel):
    """Cryptographically bound capability token issued to PEP.
    
    Binds: request_id, principal, resource, operation, limits, policy_version, expiry, nonce.
    """
    authorization_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nonce: str = Field(default_factory=lambda: str(uuid.uuid4().hex))
    request_id: str
    principal: str
    resource: str
    operation: str
    action: Action
    permitted_volume: float
    issued_at: float
    expires_at: float
    policy_version: str
    signature: str = ""

    def canonical_payload(self) -> str:
        payload = {
            "authorization_id": self.authorization_id,
            "nonce": self.nonce,
            "request_id": self.request_id,
            "principal": self.principal,
            "resource": self.resource,
            "operation": self.operation,
            "action": int(self.action),
            "permitted_volume": round(float(self.permitted_volume), 6),
            "issued_at": round(float(self.issued_at), 3),
            "expires_at": round(float(self.expires_at), 3),
            "policy_version": self.policy_version,
        }
        return json.dumps(payload, sort_keys=True)

    def sign(self, secret_key: bytes) -> "Authorization":
        payload_bytes = self.canonical_payload().encode("utf-8")
        self.signature = hmac.new(secret_key, payload_bytes, hashlib.sha256).hexdigest()
        return self

    def verify(self, secret_key: bytes) -> bool:
        if not self.signature:
            return False
        expected = hmac.new(secret_key, self.canonical_payload().encode("utf-8"), hashlib.sha256).hexdigest()
        return hmac.compare_digest(self.signature, expected)


class AuditRecord(BaseModel):
    """Tamper-evident audit log record.
    
    Per-decision record with write-ahead and terminal ack status.
    """
    record_id: int = 0
    prev_hash: str = "0" * 64
    entry_hash: str = ""
    correlation_id: str
    request_id: str
    pseudonymous_principal: str
    evidence_timestamp: float
    decision_timestamp: float
    schema_version: str = "1.0.0"
    policy_hash: str
    model_hash: str
    risk_score: float
    risk_inputs: Dict[str, float]
    budget_before: float
    budget_after: float
    mask: List[int]
    feasible_set: List[int]
    proposed_action: int
    executed_action: int
    triggered_rules: List[str]
    enforcement_status: EnforcementAckStatus = EnforcementAckStatus.PENDING
    enforcement_ack_timestamp: Optional[float] = None
    bytes_transferred: float = 0.0

    def compute_hash(self) -> str:
        body = {
            "record_id": self.record_id,
            "prev_hash": self.prev_hash,
            "correlation_id": self.correlation_id,
            "request_id": self.request_id,
            "pseudonymous_principal": self.pseudonymous_principal,
            "decision_timestamp": round(self.decision_timestamp, 3),
            "schema_version": self.schema_version,
            "policy_hash": self.policy_hash,
            "model_hash": self.model_hash,
            "risk_score": round(self.risk_score, 4),
            "budget_before": round(self.budget_before, 4),
            "budget_after": round(self.budget_after, 4),
            "proposed_action": self.proposed_action,
            "executed_action": self.executed_action,
        }
        encoded = json.dumps(body, sort_keys=True).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()
