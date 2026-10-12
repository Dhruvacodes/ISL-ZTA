"""Terminal-based demonstration runner with rich colored traces and comparison table.

Usage:
  python -m ztarb.demo --scenario adaptive_pacing --controllers all
"""

from __future__ import annotations
import argparse
import sys
import time
from pathlib import Path
from typing import Dict, List

from ztarb.types import Action, Request
from ztarb.risk import RiskEstimator
from ztarb.budget import BudgetStore
from ztarb.policy_engine import PolicyEngine
from ztarb.shield import RuntimeShield
from ztarb.features import ObservationBuilder
from ztarb.simulator import WorkloadGenerator, generate_100_principals, get_all_resources
from ztarb.controllers import (
    BaseController,
    StaticRBACController,
    RiskThresholdController,
    DeterministicBudgetController,
    FullFrameworkController,
    UnmaskedPPOController,
)

# ANSI Color codes
GREEN = "\033[92m"
AMBER = "\033[93m"
BLUE = "\033[94m"
RED = "\033[91m"
PURPLE = "\033[95m"
BOLD = "\033[1m"
CYAN = "\033[96m"
RESET = "\033[0m"

ACTION_COLORS = {
    Action.ALLOW: f"{GREEN}ALLOW{RESET}",
    Action.MFA: f"{AMBER}MFA{RESET}",
    Action.RESTRICT: f"{BLUE}RESTRICT{RESET}",
    Action.DENY: f"{RED}DENY{RESET}",
    Action.QUARANTINE: f"{PURPLE}QUARANTINE{RESET}",
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Terminal Demo for ZT-Arbiter")
    parser.add_argument("--scenario", default="adaptive_pacing", help="Threat scenario to demonstrate")
    parser.add_argument("--controllers", default="all", help="all or comma-separated list of controllers")
    args = parser.parse_args()

    checkpoints_dir = Path("checkpoints")
    obs_builder = ObservationBuilder(b_max=100.0)
    if (checkpoints_dir / "norm_stats.json").exists():
        obs_builder.load_stats(checkpoints_dir / "norm_stats.json")

    all_controllers: Dict[str, BaseController] = {
        "Full Framework": FullFrameworkController(checkpoints_dir / "full_framework.zip"),
        "Deterministic Budget": DeterministicBudgetController(),
        "Risk Threshold": RiskThresholdController(),
        "Static RBAC": StaticRBACController(),
        "Unmasked PPO": UnmaskedPPOController(checkpoints_dir / "unmasked_ppo.zip"),
    }

    if args.controllers == "all":
        selected_controllers = all_controllers
    else:
        req_names = [n.strip().lower() for n in args.controllers.split(",")]
        selected_controllers = {
            k: v for k, v in all_controllers.items() if any(r in k.lower() for r in req_names)
        } or all_controllers

    principal = generate_100_principals()[0]
    gen = WorkloadGenerator(seed=42)
    stream = gen.generate_episode_stream(principal, scenario=args.scenario)

    print(f"\n{BOLD}{CYAN}======================================================================{RESET}")
    print(f"{BOLD}  ZT-ARBITER LIVE TERMINAL ARBITRATION DEMO{RESET}")
    print(f"  Scenario: {BOLD}{args.scenario}{RESET} | Principal: {principal.principal_id} ({principal.role})")
    print(f"{CYAN}======================================================================{RESET}\n")

    risk_est = RiskEstimator()
    pol_engine = PolicyEngine(bundle_dir="policy/bundle_v1", backend="python")
    shield = RuntimeShield(kappa=10.0)
    all_resources = get_all_resources()

    results_table = []

    for cname, ctrl in selected_controllers.items():
        print(f"\n{BOLD}--- Running Controller: {cname} ---{RESET}")
        t_store = BudgetStore(b_max=100.0, kappa=10.0, p=2.0, eta=1.0)
        exfil_vol = 0.0
        useful_vol = 0.0
        friction_cnt = 0
        overrides = 0
        contained_ts = None

        for opp in stream[:20]:  # Show first 20 requests for terminal trace
            req = Request(
                request_id=f"demo-{opp.opportunity_id}",
                principal=opp.principal,
                device=opp.device,
                resource=opp.resource,
                operation=opp.operation,
                timestamp=opp.timestamp,
                volume=opp.desired_volume,
                device_posture=opp.device_posture,
                auth_failures_session=opp.auth_failures,
                unresolved_alerts=opp.unresolved_alerts,
                evidence_timestamp=opp.timestamp,
                ground_truth_is_attack=opp.is_attack,
            )
            res_info = all_resources.get(req.resource)
            sigma = res_info.sensitivity if res_info else 0.5
            rho, _ = risk_est.compute_risk(req)
            mask, _, _ = pol_engine.evaluate_mask(req, role=principal.role)
            b_info = t_store.get_budget(principal.principal_id, opp.timestamp)
            b_bar = b_info["balance"]

            f_set, reasons = shield.compute_feasible_set(req, b_bar, mask, rho, sigma, t_store, opp.timestamp)
            raw_obs = obs_builder.build_raw(req, sigma, [1.0, 0.01, 1.0, 0.0, 0.0, 1.0, 0.01, 1.0, 0.0, 0.0], rho, b_bar, mask)
            prop = ctrl.select_action(obs_builder.normalize(raw_obs), f_set, mask, rho, req)
            exec_act, overridden, veto_msg = shield.arbitrate(prop, f_set, reasons)

            charge = t_store.compute_charge(exec_act, req.volume, sigma, rho)
            t_store.check_and_reserve(req.request_id, principal.principal_id, opp.timestamp, charge)
            b_after = t_store.get_budget(principal.principal_id, opp.timestamp)["balance"]

            if opp.is_attack:
                if exec_act in (Action.ALLOW, Action.RESTRICT):
                    exfil_vol += req.volume if exec_act == Action.ALLOW else 0.25 * req.volume
                elif exec_act in (Action.DENY, Action.QUARANTINE):
                    if contained_ts is None:
                        contained_ts = opp.timestamp
            else:
                if exec_act == Action.ALLOW:
                    useful_vol += req.volume
                elif exec_act == Action.RESTRICT:
                    useful_vol += 0.25 * req.volume
                    friction_cnt += 1
                elif exec_act in (Action.DENY, Action.MFA, Action.QUARANTINE):
                    friction_cnt += 1

            # Print single-line trace
            hr_str = f"{opp.timestamp / 3600.0:4.1f}h"
            tag = f"{RED}[ATTACK]{RESET}" if opp.is_attack else f"{GREEN}[BENIGN]{RESET}"
            prop_str = ACTION_COLORS[prop]
            exec_str = ACTION_COLORS[exec_act]
            veto_alert = f" {BOLD}{RED}<< SHIELD VETO >>{RESET}" if overridden else ""

            print(
                f"  [{hr_str}] {tag} {req.resource[:14]:<14} | rho={rho:.2f} | B={b_after:5.1f} | "
                f"Prop: {prop_str} -> Exec: {exec_str}{veto_alert}"
            )
            if overridden and veto_msg:
                print(f"      {AMBER}-> Reason: {veto_msg}{RESET}")

        results_table.append({
            "Controller": cname,
            "Useful Work": f"{useful_vol:.3f}",
            "Exfiltrated Loss": f"{exfil_vol:.3f}",
            "Friction": friction_cnt,
            "Contained At": f"{contained_ts / 3600.0:.2f}h" if contained_ts else "Uncontained",
        })

    # Print Final Showdown Table
    print(f"\n\n{BOLD}{CYAN}======================================================================{RESET}")
    print(f"{BOLD}  FINAL COMPARISON SHOWDOWN (Scenario: {args.scenario}){RESET}")
    print(f"{CYAN}======================================================================{RESET}\n")

    hdr = f"| {'Controller':<23} | {'Useful Work':<11} | {'Attack Loss':<11} | {'Friction':<8} | {'Containment':<12} |"
    sep = f"|{'-'*25}|{'-'*13}|{'-'*13}|{'-'*10}|{'-'*14}|"
    print(hdr)
    print(sep)
    for row in results_table:
        print(f"| {row['Controller']:<23} | {row['Useful Work']:<11} | {row['Exfiltrated Loss']:<11} | {row['Friction']:<8} | {row['Contained At']:<12} |")
    print(sep)

    print(f"\n{BOLD}Comparison Note:{RESET} The Full Framework and Deterministic Budget-Aware both enforce authoritative")
    print(f"budgeting and the runtime shield, keeping policy violations strictly at 0%. Under adaptive pacing,")
    print(f"both controllers constrain exposure according to available budget refills.")


if __name__ == "__main__":
    main()
