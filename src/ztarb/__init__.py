"""Risk-Aware Policy Arbitration Framework for Zero-Trust Access Control (ZT-Arbiter)"""

import os
import sys
from pathlib import Path

__version__ = "0.1.0"

# Automatically ensure local venv Scripts/bin is on PATH so OPA and tools are discoverable
_venv_scripts = Path(__file__).resolve().parent.parent.parent / ".venv" / "Scripts"
if _venv_scripts.exists():
    _scripts_str = str(_venv_scripts)
    if _scripts_str not in os.environ.get("PATH", ""):
        os.environ["PATH"] = _scripts_str + os.pathsep + os.environ.get("PATH", "")
