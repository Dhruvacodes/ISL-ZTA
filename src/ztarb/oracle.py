"""Independent verification oracle for Policy Violation Rate (PVR).

Citation:
- Eq. (14): PVR = (1 / N) * sum_t 1[violation(q_t, a_t)]

CRITICAL INDEPENDENCE REQUIREMENT:
This oracle is a completely separate, independently written specification table.
It does NOT import or reuse policy_engine.py.
"""

from __future__ import annotations
from typing import Dict, List, Set, Tuple

from ztarb.types import Action, Request


# Independent specification rules: Hardcoded ground truth table
INDEPENDENT_ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    "engineering": {"src_repo", "dev_db", "build_artifact", "internal_docs", "shared_storage"},
    "finance": {"billing_db", "payroll_records", "quarterly_reports", "internal_docs"},
    "support": {"ticket_system", "customer_profile", "internal_docs", "kb_articles"},
    "executive": {"board_deck", "quarterly_reports", "internal_docs", "mna_confidential"},
    "security_admin": {
        "src_repo", "dev_db", "build_artifact", "internal_docs", "shared_storage",
        "billing_db", "payroll_records", "quarterly_reports", "ticket_system",
        "customer_profile", "kb_articles", "board_deck", "mna_confidential",
        "prod_secrets", "pki_keys", "audit_master", "customer_pii", "ops_dash",
        "analytics_cache", "logs_archive"
    },
}

INDEPENDENT_MIN_POSTURE: Dict[str, float] = {
    "engineering": 0.60,
    "finance": 0.70,
    "support": 0.50,
    "executive": 0.65,
    "security_admin": 0.85,
}

INDEPENDENT_REQUIRE_MFA_RESOURCES: Set[str] = {
    "payroll_records",
    "mna_confidential",
    "board_deck",
    "prod_secrets",
    "pki_keys",
    "audit_master",
    "customer_pii",
}

INDEPENDENT_NON_RESTRICTABLE_RESOURCES: Set[str] = {
    "prod_secrets",
    "pki_keys",
    "audit_master",
}


class IndependentOracle:
    """Independent oracle checking whether an executed action violated ground-truth policy."""

    @classmethod
    def is_violation(cls, req: Request, role: str, executed_action: Action) -> Tuple[bool, str]:
        """Verify Eq. (14) violation condition.
        
        DENY and QUARANTINE can NEVER be a policy violation.
        ALLOW or RESTRICT or MFA on unauthorized resources is a violation.
        ALLOW with insufficient device posture or missing MFA is a violation.
        RESTRICT on non-restrictable resources is a violation.
        """
        # Rejecting access is always safe
        if executed_action in (Action.DENY, Action.QUARANTINE):
            return False, "Safe rejection"

        allowed_resources = INDEPENDENT_ROLE_PERMISSIONS.get(role, set())

        # 1. Access to forbidden resource
        if req.resource not in allowed_resources:
            return True, f"Role '{role}' is not entitled to resource '{req.resource}'"

        # 2. MFA on forbidden resource (MFA can never be offered for forbidden resource)
        # Note: if req.resource is in allowed_resources, MFA is valid.

        # 3. RESTRICT violations
        if executed_action == Action.RESTRICT:
            if req.resource in INDEPENDENT_NON_RESTRICTABLE_RESOURCES:
                return True, f"Resource '{req.resource}' does not support restricted scope"
            if req.operation != "read":
                return True, f"RESTRICT only permits read operations (requested: {req.operation})"
            return False, "Valid restriction"

        # 4. ALLOW violations
        if executed_action == Action.ALLOW:
            # Check posture minimum
            min_posture = INDEPENDENT_MIN_POSTURE.get(role, 0.70)
            if req.device_posture < min_posture - 1e-6:
                return True, f"Device posture {req.device_posture:.2f} below required minimum {min_posture:.2f}"

            # Check MFA requirement
            if req.resource in INDEPENDENT_REQUIRE_MFA_RESOURCES:
                if not req.mfa_passed:
                    return True, f"High sensitivity resource '{req.resource}' requires MFA"

            return False, "Valid allowance"

        # 5. MFA challenge action
        if executed_action == Action.MFA:
            return False, "Valid challenge"

        return False, "Valid"

    @classmethod
    def compute_pvr(cls, decisions: List[Tuple[Request, str, Action]]) -> float:
        """Compute Eq. (14): PVR = (1 / N) * sum_t 1[violation(q_t, a_t)]."""
        if not decisions:
            return 0.0
        violations = sum(1 for req, role, act in decisions if cls.is_violation(req, role, act)[0])
        return float(violations / len(decisions))
