"""Test validating dashboard integrity and traceability of empirical figures."""

import json
import re
from pathlib import Path
import pytest


def test_summary_json_contains_empirical_evaluations():
    """Verify results/summary.json contains real empirical data."""
    summary_path = Path("results/summary.json")
    assert summary_path.exists(), "results/summary.json must exist"
    
    with open(summary_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    assert "controllers" in data
    assert "Full Framework" in data["controllers"]
    assert "Static RBAC" in data["controllers"]
    assert "Deterministic Budget" in data["controllers"]
    
    ff = data["controllers"]["Full Framework"]
    rbac = data["controllers"]["Static RBAC"]
    
    # Attack success for RBAC must be > 0 and greater than Full Framework
    assert rbac["attack_success_rate"]["mean"] > 0.0
    assert rbac["attack_success_rate"]["mean"] > ff["attack_success_rate"]["mean"]
    assert ff["pvr_percent"] == 0.0


def test_screenshots_committed_for_all_eleven_sections():
    """Verify all 11 sections have committed screenshots in docs/screenshots/."""
    screenshot_dir = Path("docs/screenshots")
    assert screenshot_dir.exists(), "docs/screenshots directory must exist"
    
    expected_screens = [
        "overview.png",
        "theater.png",
        "showdown.png",
        "training.png",
        "results.png",
        "breakit.png",
        "audit.png",
        "policy.png",
        "simulator.png",
        "tests.png",
        "architecture.png",
    ]
    
    for screen in expected_screens:
        target = screenshot_dir / screen
        assert target.exists(), f"Missing screenshot artifact: {screen}"
        assert target.stat().st_size > 1000, f"Screenshot {screen} appears empty or corrupted"


def test_frontend_kpi_components_not_hardcoded():
    """Verify that KPI cards in OverviewSection.tsx bind dynamic variables from summary."""
    overview_src = Path("web/src/sections/OverviewSection.tsx")
    assert overview_src.exists()
    content = overview_src.read_text(encoding="utf-8")
    
    # Verify that values are bound dynamically from summary state
    assert "{totalDecisions" in content
    assert "{policyViolations}" in content
    assert "{attackSuccessFull}" in content
    assert "{usefulWork}" in content
    assert "{p95Latency}" in content
    assert "{e2eP95}" in content
    assert "{shieldInterventionsPct}" in content


def test_acceptance_endpoint_criteria_all_verified():
    """Verify that /api/acceptance verifies all criteria from real files."""
    import asyncio
    from ztarb.service.app import get_acceptance_checklist
    res = asyncio.run(get_acceptance_checklist())
    assert res["all_passed"] is True, f"Some criteria failed: {res['criteria']}"
    assert len(res["criteria"]) == 7
