"""Policy evaluation engine supporting pure-Python reference and OPA backends.

Citations:
- Eq. (8): m_t(a) = 1[P_v(q, x, h, a) = permit]
- Section 3.4: Rego bundle policy-as-code, version hash, fail-closed semantics
"""

from __future__ import annotations
import hashlib
import json
import os
import shutil
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from ztarb.types import Action, Request


def compute_bundle_hash(bundle_dir: str | Path) -> str:
    """Compute SHA-256 hash of all policy files in the bundle directory."""
    bundle_path = Path(bundle_dir)
    if not bundle_path.exists():
        return hashlib.sha256(b"missing-bundle").hexdigest()

    hasher = hashlib.sha256()
    # Sort files for deterministic hashing
    for p in sorted(bundle_path.glob("**/*")):
        if p.is_file() and p.suffix in (".rego", ".json", ".yaml", ".yml"):
            hasher.update(p.name.encode("utf-8"))
            hasher.update(p.read_bytes())
    return hasher.hexdigest()


class PythonPolicyEvaluator:
    """Pure-Python reference policy evaluator matching Rego bundle semantics."""

    def __init__(self, bundle_dir: str | Path):
        self.bundle_dir = Path(bundle_dir)
        self.data: Dict[str, Any] = {}
        self._load_data()

    def _load_data(self) -> None:
        data_file = self.bundle_dir / "data.json"
        if data_file.exists():
            with open(data_file, "r", encoding="utf-8") as f:
                self.data = json.load(f)
        else:
            self.data = {"roles": {}, "resources": {}}

    def evaluate(self, req: Request, role: str, quarantine_capable: bool = True) -> Tuple[List[int], List[str]]:
        """Evaluate policy mask m_t and return (mask, triggered_rules).
        
        # Eq. (8): m_t(a) = 1[P_v(q, x, h, a) = permit]
        Actions: [ALLOW=0, MFA=1, RESTRICT=2, DENY=3, QUARANTINE=4]
        Fail-closed: In any error or missing rule, action is not permitted, except DENY which is always 1.
        """
        rules_triggered: List[str] = []
        mask = [0, 0, 0, 1, 0]  # DENY is always 1 at platform level

        try:
            roles = self.data.get("roles", {})
            resources = self.data.get("resources", {})

            role_info = roles.get(role)
            if not role_info:
                rules_triggered.append("unknown_role_deny")
                if quarantine_capable and req.auth_failures_session >= 3:
                    mask[Action.QUARANTINE] = 1
                    rules_triggered.append("quarantine_auth_failure_breach")
                return mask, rules_triggered

            allowed_resources = role_info.get("allowed_resources", [])
            allowed_operations = role_info.get("allowed_operations", [])
            min_posture = role_info.get("min_device_posture", 0.7)

            resource_info = resources.get(req.resource, {})
            require_mfa = resource_info.get("require_mfa", False)
            allow_restrict = resource_info.get("allow_restrict", False)

            # Role entitlement
            role_has_resource = req.resource in allowed_resources
            role_has_op = req.operation in allowed_operations
            posture_ok = req.device_posture >= min_posture
            mfa_satisfied = (not require_mfa) or req.mfa_passed

            # 1. ALLOW: must have resource + op + posture + mfa_satisfied
            if role_has_resource and role_has_op and posture_ok and mfa_satisfied:
                mask[Action.ALLOW] = 1
                rules_triggered.append("rule_allow_access")

            # 2. MFA: only if role is legitimately entitled to resource and op, but mfa not yet completed
            # CRITICAL: MFA can NEVER make an unauthorized resource accessible!
            if role_has_resource and role_has_op and not req.mfa_passed:
                mask[Action.MFA] = 1
                rules_triggered.append("rule_permit_mfa_challenge")

            # 3. RESTRICT: role has resource, read operation, and resource permits restriction
            if role_has_resource and req.operation == "read" and allow_restrict:
                mask[Action.RESTRICT] = 1
                rules_triggered.append("rule_permit_restricted_access")

            # 4. QUARANTINE: requires capability and anomaly condition
            if quarantine_capable:
                if req.auth_failures_session >= 3:
                    mask[Action.QUARANTINE] = 1
                    rules_triggered.append("quarantine_auth_failures")
                elif not role_has_resource:
                    mask[Action.QUARANTINE] = 1
                    rules_triggered.append("quarantine_unauthorized_probe")
                elif req.device_posture < 0.35:
                    mask[Action.QUARANTINE] = 1
                    rules_triggered.append("quarantine_compromised_device")

        except Exception as ex:
            # Fail closed: keep only DENY
            mask = [0, 0, 0, 1, 0]
            rules_triggered.append(f"policy_eval_exception_{ex}")

        return mask, rules_triggered


class OPAPolicyEvaluator:
    """OPA CLI subprocess evaluator executing access.rego with data.json."""

    def __init__(self, bundle_dir: str | Path):
        self.bundle_dir = Path(bundle_dir)
        self.opa_bin = shutil.which("opa")
        if not self.opa_bin:
            raise RuntimeError("OPA binary not found on system PATH")

    def evaluate(self, req: Request, role: str, quarantine_capable: bool = True) -> Tuple[List[int], List[str]]:
        input_data = {
            "principal": req.principal,
            "role": role,
            "device": req.device,
            "resource": req.resource,
            "operation": req.operation,
            "device_posture": float(req.device_posture),
            "auth_failures_session": int(req.auth_failures_session),
            "mfa_passed": bool(req.mfa_passed),
            "quarantine_capable": bool(quarantine_capable),
        }

        rego_path = self.bundle_dir / "access.rego"
        data_path = self.bundle_dir / "data.json"

        cmd = [
            self.opa_bin,
            "eval",
            "--data", str(data_path),
            "--data", str(rego_path),
            "--stdin-input",
            "data.ztarb.access.mask",
        ]

        try:
            res = subprocess.run(
                cmd,
                input=json.dumps(input_data).encode("utf-8"),
                capture_output=True,
                timeout=5.0,
                check=True,
            )
            parsed = json.loads(res.stdout.decode("utf-8"))
            mask = parsed["result"][0]["expressions"][0]["value"]
            # Platform level ensure DENY is 1
            mask[Action.DENY] = 1
            return mask, ["opa_evaluated"]
        except Exception as ex:
            # Fail closed
            return [0, 0, 0, 1, 0], [f"opa_error_{ex}"]


class PolicyEngine:
    """Unified policy engine with pluggable backend and version hashing."""

    def __init__(
        self,
        bundle_dir: str | Path = "policy/bundle_v1",
        backend: str = "python",
    ):
        self.bundle_dir = Path(bundle_dir)
        self.policy_hash = compute_bundle_hash(self.bundle_dir)
        self.backend_name = backend

        if backend == "opa":
            if shutil.which("opa"):
                self.evaluator = OPAPolicyEvaluator(self.bundle_dir)
            else:
                # Fallback to python as specified
                self.evaluator = PythonPolicyEvaluator(self.bundle_dir)
                self.backend_name = "python"
        else:
            self.evaluator = PythonPolicyEvaluator(self.bundle_dir)

    def evaluate_mask(
        self,
        req: Request,
        role: str,
        quarantine_capable: bool = True,
    ) -> Tuple[List[int], List[str], str]:
        """Compute action mask m_t (Eq. 8), triggered rules, and policy hash."""
        mask, rules = self.evaluator.evaluate(req, role, quarantine_capable=quarantine_capable)
        return mask, rules, self.policy_hash

    @property
    def backend(self) -> str:
        return self.backend_name
