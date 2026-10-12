"""Policy Enforcement Point (PEP) enforcing cryptographic authorization bindings.

Section 3.5:
The PEP verifies every binding, enforces the limits (byte/op/time caps),
rejects replays and expired or stale-policy authorizations, and only then acknowledges.
An ack failure is NEVER treated as success.
"""

from __future__ import annotations
import hmac
import time
from typing import Dict, Optional, Set, Tuple

from ztarb.types import Action, Authorization, EnforcementAckStatus


class PolicyEnforcementPoint:
    """Zero-Trust PEP verifying capabilities, nonces, policies, and resource boundaries."""

    def __init__(self, secret_key: bytes = b"zt-arbiter-pep-shared-secret-key-2026"):
        self.secret_key = secret_key
        self._used_nonces: Set[str] = set()
        self.current_policy_version: str = ""
        # Simulate network or daemon ack failure for failure injection
        self.simulate_ack_failure: bool = False

    def set_current_policy_version(self, policy_version: str) -> None:
        self.current_policy_version = policy_version

    def enforce(
        self,
        auth: Authorization,
        actual_volume: float,
        current_ts: float,
    ) -> Tuple[bool, EnforcementAckStatus, str]:
        """Validate authorization token and acknowledge execution."""
        # Check simulation failure
        if self.simulate_ack_failure:
            return False, EnforcementAckStatus.REJECTED_PEP, "Simulated PEP daemon communication failure"

        # 1. Cryptographic HMAC verification
        if not auth.verify(self.secret_key):
            return False, EnforcementAckStatus.TAMPERED, "HMAC signature mismatch or tampered authorization token"

        # 2. Nonce replay check
        if auth.nonce in self._used_nonces:
            return False, EnforcementAckStatus.NONCE_REPLAY, f"Authorization nonce {auth.nonce[:8]} already used (replay detected)"

        # 3. Expiration check
        if current_ts > auth.expires_at:
            return False, EnforcementAckStatus.EXPIRED, f"Authorization token expired at {auth.expires_at:.2f} (current {current_ts:.2f})"

        # 4. Stale policy version check
        if self.current_policy_version and auth.policy_version != self.current_policy_version:
            return (
                False,
                EnforcementAckStatus.STALE_POLICY,
                f"Policy version stale: token is {auth.policy_version[:8]}, current is {self.current_policy_version[:8]}",
            )

        # 5. Volume cap check
        if actual_volume > auth.permitted_volume + 1e-6:
            return (
                False,
                EnforcementAckStatus.VOLUME_EXCEEDED,
                f"Requested execution volume {actual_volume:.4f} exceeds permitted cap {auth.permitted_volume:.4f}",
            )

        # Successfully validated: mark nonce consumed
        self._used_nonces.add(auth.nonce)
        return True, EnforcementAckStatus.ACKED, "Authorization acknowledged and executed"
