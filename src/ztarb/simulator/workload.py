"""Discrete-event workload generator and attack families.

Citations:
- Section 4: Action-independent event stream, 24h episodes, seeded generators
- Benign behaviors: routine reads, bulk tasks, auth fatigue
- Attack families: Burst, Gradual, Repeated Auth, Credential Abuse, Session Resets, Adaptive Pacing
"""

from __future__ import annotations
import math
import random
import uuid
from typing import Dict, List, Optional, Tuple

from ztarb.simulator.models import EventOpportunity, SyntheticPrincipal, SyntheticResource


def get_all_resources() -> Dict[str, SyntheticResource]:
    """Map of all 20 benchmark resources across 3 sensitivity tiers."""
    resources = {
        # Low sensitivity (sigma = 0.2)
        "internal_docs": SyntheticResource("internal_docs", 0.2, allow_restrict=True, require_mfa=False),
        "kb_articles": SyntheticResource("kb_articles", 0.2, allow_restrict=True, require_mfa=False),
        "shared_storage": SyntheticResource("shared_storage", 0.2, allow_restrict=True, require_mfa=False),
        "ticket_system": SyntheticResource("ticket_system", 0.2, allow_restrict=True, require_mfa=False),
        "dev_db": SyntheticResource("dev_db", 0.2, allow_restrict=True, require_mfa=False),
        "build_artifact": SyntheticResource("build_artifact", 0.2, allow_restrict=True, require_mfa=False),
        # Medium sensitivity (sigma = 0.6)
        "src_repo": SyntheticResource("src_repo", 0.6, allow_restrict=True, require_mfa=False),
        "customer_profile": SyntheticResource("customer_profile", 0.6, allow_restrict=True, require_mfa=False),
        "billing_db": SyntheticResource("billing_db", 0.6, allow_restrict=True, require_mfa=False),
        "quarterly_reports": SyntheticResource("quarterly_reports", 0.6, allow_restrict=True, require_mfa=False),
        "ops_dash": SyntheticResource("ops_dash", 0.6, allow_restrict=True, require_mfa=False),
        "analytics_cache": SyntheticResource("analytics_cache", 0.6, allow_restrict=True, require_mfa=False),
        "logs_archive": SyntheticResource("logs_archive", 0.6, allow_restrict=True, require_mfa=False),
        # High sensitivity (sigma = 1.0)
        "payroll_records": SyntheticResource("payroll_records", 1.0, allow_restrict=True, require_mfa=True),
        "mna_confidential": SyntheticResource("mna_confidential", 1.0, allow_restrict=True, require_mfa=True),
        "board_deck": SyntheticResource("board_deck", 1.0, allow_restrict=True, require_mfa=True),
        "prod_secrets": SyntheticResource("prod_secrets", 1.0, allow_restrict=False, require_mfa=True),
        "pki_keys": SyntheticResource("pki_keys", 1.0, allow_restrict=False, require_mfa=True),
        "audit_master": SyntheticResource("audit_master", 1.0, allow_restrict=False, require_mfa=True),
        "customer_pii": SyntheticResource("customer_pii", 1.0, allow_restrict=True, require_mfa=True),
    }
    return resources


class WorkloadGenerator:
    """Action-independent pre-generator of 24-hour event opportunity streams."""

    def __init__(self, seed: int = 42):
        self.seed = seed
        self.rng = random.Random(seed)
        self.resources = get_all_resources()

    def generate_benign_stream(
        self,
        principal: SyntheticPrincipal,
        duration_sec: float = 86400.0,
    ) -> List[EventOpportunity]:
        """Generate benign daily routine accesses for a principal."""
        events: List[EventOpportunity] = []
        current_ts = self.rng.uniform(0.0, 60.0)

        # Baseline allowable resources for role
        role_res_map = {
            "engineering": ["src_repo", "dev_db", "build_artifact", "internal_docs", "shared_storage"],
            "finance": ["billing_db", "payroll_records", "quarterly_reports", "internal_docs"],
            "support": ["ticket_system", "customer_profile", "internal_docs", "kb_articles"],
            "executive": ["board_deck", "quarterly_reports", "internal_docs", "mna_confidential"],
        }
        allowed_res = role_res_map.get(principal.role, ["internal_docs"])

        while current_ts < duration_sec:
            # Diurnal activity weighting: higher between 8am and 6pm
            hour = (current_ts % 86400.0) / 3600.0
            is_work_hours = 8.0 <= hour <= 18.0
            interval_mean = 3600.0 / principal.rate_per_hour if is_work_hours else 3600.0 * 2.0
            interval = self.rng.expovariate(1.0 / max(10.0, interval_mean))
            current_ts += interval
            if current_ts >= duration_sec:
                break

            # Bulk vs routine
            is_bulk = self.rng.random() < 0.05
            vol = self.rng.uniform(0.08, 0.20) if is_bulk else self.rng.uniform(0.005, 0.03)

            # Occasional auth mistake
            mistake = self.rng.random() < 0.03
            auth_fails = self.rng.randint(1, 2) if mistake else 0

            # Device selection
            device = self.rng.choice(principal.home_devices)
            posture = float(min(1.0, max(0.5, self.rng.gauss(principal.posture_mean, principal.posture_std))))

            res = self.rng.choice(allowed_res)
            op = "read" if self.rng.random() < 0.85 else "write"

            events.append(
                EventOpportunity(
                    opportunity_id=f"benign-{self.rng.getrandbits(32):08x}",
                    timestamp=current_ts,
                    principal=principal.principal_id,
                    role=principal.role,
                    device=device,
                    resource=res,
                    operation=op,
                    desired_volume=vol,
                    device_posture=posture,
                    auth_failures=auth_fails,
                    unresolved_alerts=0,
                    is_attack=False,
                    attack_family=None,
                    target_volume=0.0,
                )
            )

        return events

    def inject_attack_family(
        self,
        base_stream: List[EventOpportunity],
        principal: SyntheticPrincipal,
        family: str,
        start_ts: float = 3600.0 * 4.0,  # 4 hours into episode
    ) -> List[EventOpportunity]:
        """Interleave attack opportunity events according to specified threat family.
        
        Zero-Trust Threat Model:
        The attacker holds compromised credentials belonging to the victim principal.
        To evade perimeter access controls, the adversary targets high-value resources that the
        principal's role is legitimately entitled to read (e.g. src_repo for engineering,
        billing_db for finance, customer_profile for support, quarterly_reports for executive).
        This guarantees that stateless Static RBAC allows the requests, creating a realistic
        insider/credential-compromise test bed where only stateful continuous arbitration can
        discriminate legitimate routine access from malicious exfiltration.
        """
        attack_events: List[EventOpportunity] = []
        
        # Select role-authorized high-value target resource
        role_targets = {
            "engineering": "src_repo",           # sigma = 0.6, require_mfa = False
            "finance": "billing_db",             # sigma = 0.6, require_mfa = False
            "support": "customer_profile",       # sigma = 0.6, require_mfa = False
            "executive": "quarterly_reports",     # sigma = 0.6, require_mfa = False
        }
        target_res = role_targets.get(principal.role, "src_repo")
        home_dev = principal.home_devices[0] if principal.home_devices else "managed_workstation"

        if family == "burst_access":
            # Rapid barrage of high-volume exfiltration requests using valid credentials
            ts = start_ts
            n_reqs = 8
            per_req_vol = 0.35
            tot_target = n_reqs * per_req_vol
            for _ in range(n_reqs):
                ts += self.rng.uniform(5.0, 20.0)
                attack_events.append(
                    EventOpportunity(
                        opportunity_id=f"atk-burst-{self.rng.getrandbits(32):08x}",
                        timestamp=ts,
                        principal=principal.principal_id,
                        role=principal.role,
                        device=home_dev,
                        resource=target_res,
                        operation="read",
                        desired_volume=per_req_vol,
                        device_posture=0.82,
                        auth_failures=0,
                        unresolved_alerts=1,
                        is_attack=True,
                        attack_family="burst_access",
                        target_volume=tot_target,
                    )
                )

        elif family == "gradual_exfiltration":
            # Low and slow reading over hours: small volume, high posture, below single-request risk thresholds
            ts = start_ts
            n_reqs = 16
            per_req_vol = 0.03
            tot_target = n_reqs * per_req_vol
            for _ in range(n_reqs):
                ts += self.rng.uniform(180.0, 300.0)
                attack_events.append(
                    EventOpportunity(
                        opportunity_id=f"atk-gradual-{self.rng.getrandbits(32):08x}",
                        timestamp=ts,
                        principal=principal.principal_id,
                        role=principal.role,
                        device=home_dev,
                        resource=target_res,
                        operation="read",
                        desired_volume=per_req_vol,
                        device_posture=0.85,
                        auth_failures=0,
                        unresolved_alerts=0,
                        is_attack=True,
                        attack_family="gradual_exfiltration",
                        target_volume=tot_target,
                    )
                )

        elif family == "repeated_auth_failures":
            # Brute forcing / token stuffing from rogue scanner
            ts = start_ts
            for i in range(7):
                ts += self.rng.uniform(2.0, 10.0)
                attack_events.append(
                    EventOpportunity(
                        opportunity_id=f"atk-authfail-{self.rng.getrandbits(32):08x}",
                        timestamp=ts,
                        principal=principal.principal_id,
                        role=principal.role,
                        device="rogue_client_scanner",
                        resource=target_res,
                        operation="read",
                        desired_volume=0.02,
                        device_posture=0.35,
                        auth_failures=i + 3,
                        unresolved_alerts=2,
                        is_attack=True,
                        attack_family="repeated_auth_failures",
                        target_volume=0.14,
                    )
                )

        elif family == "credential_abuse":
            # Valid credentials from unmanaged device with borderline acceptable posture
            ts = start_ts
            n_reqs = 6
            per_req_vol = 0.08
            tot_target = n_reqs * per_req_vol
            for _ in range(n_reqs):
                ts += self.rng.uniform(60.0, 150.0)
                attack_events.append(
                    EventOpportunity(
                        opportunity_id=f"atk-credabuse-{self.rng.getrandbits(32):08x}",
                        timestamp=ts,
                        principal=principal.principal_id,
                        role=principal.role,
                        device="unmanaged_contractor_laptop",
                        resource=target_res,
                        operation="read",
                        desired_volume=per_req_vol,
                        device_posture=0.68,  # Passes static role posture gate (>0.60)
                        auth_failures=0,
                        unresolved_alerts=1,
                        is_attack=True,
                        attack_family="credential_abuse",
                        target_volume=tot_target,
                    )
                )

        elif family == "session_resets":
            # Resetting session identifiers to evade session-scoped tracking
            ts = start_ts
            n_reqs = 12
            per_req_vol = 0.12
            tot_target = n_reqs * per_req_vol
            for i in range(n_reqs):
                ts += self.rng.uniform(40.0, 80.0)
                attack_events.append(
                    EventOpportunity(
                        opportunity_id=f"atk-sessreset-{self.rng.getrandbits(32):08x}",
                        timestamp=ts,
                        principal=principal.principal_id,
                        role=principal.role,
                        device=f"device_reset_session_{i}",
                        resource=target_res,
                        operation="read",
                        desired_volume=per_req_vol,
                        device_posture=0.82,
                        auth_failures=0,
                        unresolved_alerts=0,
                        is_attack=True,
                        attack_family="session_resets",
                        target_volume=tot_target,
                    )
                )

        elif family == "adaptive_pacing":
            # Adversary spaces out requests aiming just below refill rate eta (1.0/min)
            # Desired volume small, interval >= 70 seconds
            ts = start_ts
            n_reqs = 14
            per_req_vol = 0.04
            tot_target = n_reqs * per_req_vol
            for _ in range(n_reqs):
                ts += self.rng.uniform(70.0, 110.0)
                attack_events.append(
                    EventOpportunity(
                        opportunity_id=f"atk-pace-{self.rng.getrandbits(32):08x}",
                        timestamp=ts,
                        principal=principal.principal_id,
                        role=principal.role,
                        device=home_dev,
                        resource=target_res,
                        operation="read",
                        desired_volume=per_req_vol,
                        device_posture=0.88,
                        auth_failures=0,
                        unresolved_alerts=0,
                        is_attack=True,
                        attack_family="adaptive_pacing",
                        target_volume=tot_target,
                    )
                )

        # Merge base and attack streams, sorted by timestamp
        combined = list(base_stream) + attack_events
        combined.sort(key=lambda x: x.timestamp)
        return combined

    def generate_episode_stream(
        self,
        principal: SyntheticPrincipal,
        scenario: str = "benign",
    ) -> List[EventOpportunity]:
        """Generate full reproducible 24h opportunity stream for an episode."""
        base = self.generate_benign_stream(principal)
        if scenario == "benign":
            return base
        return self.inject_attack_family(base, principal, family=scenario)
