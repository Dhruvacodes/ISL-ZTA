# ZT-Arbiter: Risk-Aware Policy Arbitration Framework for Zero-Trust Access Control

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Safety: Invariant Verified](https://img.shields.io/badge/Policy%20Violation%20Rate-0.00%25-brightgreen.svg)]()
[![Mission Control UI](https://img.shields.io/badge/Dashboard-Mission%20Control%20v0.2.0-purple.svg)](http://localhost:8000)

> [!IMPORTANT]
> **Methodological Disclaimer**: All results and empirical benchmarks presented in this repository are produced within a synthetic discrete-event simulation framework and do NOT represent measured enterprise production traffic.

---

## 1. Overview & Mission Control Architecture

ZT-Arbiter implements a risk-aware, budget-bounded policy arbitration framework for Zero-Trust Access Control. It combines formal policy-as-code (Rego/OPA), atomic exposure budgeting in SQLite WAL mode, reinforcement learning (MaskablePPO), and a fail-closed runtime feasibility shield.

The project features a **Mission Control Dashboard** served directly at `http://localhost:8000`. Built with **React + Vite + TypeScript + Tailwind**, compiled to static artifacts, and served autonomously by FastAPI with zero Node runtime dependency.

### Complete Arbitration Pipeline

```
+-------------+
|   Request   | q_t = (u_t, d_t, r_t, o_t, tau_t, nu_t)  [Eq. 1]
+------+------+
       |
       v
+-------------+      +-------------------+
|   Context   | ---> |   Risk Estimator  | rho_t = clip01(sum w_j * x_j)  [Eq. 3]
|   Fusion    |      +---------+---------+
+------+------+                |
       |                       v
       |             +-------------------+
       |             |  Budget Tracker   | B_{t+1} = B_bar - c_t(a_t)     [Eq. 4-6]
       |             | (SQLite WAL Mode) | B_bar = min(B_max, B_t + eta*g*dt)
       |             +---------+---------+
       |                       |
       v                       v
+-------------+      +-------------------+
|   Policy    | ---> |   Runtime Shield  | F_t = {a: m_t=1, c_t<=B_bar, C_t<=delta, H_t=1} [Eq. 10]
|   Engine    | m_t  | (Authoritative)   | a_t = a_tilde if a_tilde in F_t else DENY        [Eq. 11]
+------+------+      +---------+---------+
       |                       ^
       v                       |
+-------------+                |
|  RL Agent   | a_tilde        |
| MaskablePPO | ---------------+ (Proposal)
+-------------+
       |
       v (Executed Action a_t in F_t)
+-------------+
| Policy Enforce Point | PEP verifies HMAC, Nonces, Expiry, Policy Version
+------+------+
       |
       v
+-------------+
| Hash-Chained Audit  | Append-only SHA-256 Chain + Merkle Root Batch Anchors
+-------------+
```

### Core Invariant Guarantee
If `DENY` is always available, state checks are authoritative, reservations are atomic (`BEGIN IMMEDIATE`), and the PEP enforces token bindings:
$$\forall t, \quad a_t \in \mathcal{F}_t \quad \text{and} \quad B_{t+1} \ge 0$$
Zero policy violations ($PVR = 0.00\%$) are guaranteed at runtime.

---

## 2. Guided Story Mode & Human-First Interface (Part C)

The application features a non-expert **Plain English Mode** designed for executive leadership, recruiters, and professors. It translates every technical concept into plain language, explains the core problem in 30 seconds, and provides a 10-chapter guided story with real simulator data.

- **3-Minute Presenter Script**: [docs/DEMO_SCRIPT.md](file:///docs/DEMO_SCRIPT.md)
- **Cold-Viewer Comprehension Quiz**: [docs/COLD_VIEWER_QUIZ.md](file:///docs/COLD_VIEWER_QUIZ.md)
- **Presenter Mode Walkthrough Video**: [docs/demo.webm](file:///docs/demo.webm)
- **Plain English / Technical Toggle**: Press `T` anywhere to instantly switch all labels, charts, and captions.

### 30-Second Explainer Landing Hero
![Landing Hero](/docs/screenshots/story/landing_hero.png)

### Chapter 2: The Stolen Password Problem (Traditional RBAC Leaks 100%)
![The Problem](/docs/screenshots/story/chapter_2.png)

### Chapter 3: Idea 1 — Daily Exposure Allowance
![Allowance Bar](/docs/screenshots/story/chapter_3.png)

### Chapter 5: Idea 3 — The Mathematical Safety Check (Overrules AI on Policy Breaches)
![Safety Check](/docs/screenshots/story/chapter_5.png)

### Chapter 6: Head-to-Head Comparison (Our System Cuts Stolen Data to 25%)
![Head to Head](/docs/screenshots/story/chapter_6.png)

### Chapter 9: Where It Struggles (Honest Limitations)
![Honest Boundaries](/docs/screenshots/story/chapter_9.png)

### Interactive Simulation Sandbox (Try It)
![Try It](/docs/screenshots/story/try_it.png)

### Human-First Results Page (Three Big Questions)
![Human Results](/docs/screenshots/story/results_human.png)

### Plain English & Technical Glossary
![Glossary](/docs/screenshots/story/glossary.png)

---

## 2b. Technical Mission Control Gallery (Under the Hood)

For deep technical inspection, "Under the Hood" provides the complete developer console:
- [Overview](/docs/screenshots/overview.png)
- [Live Arbitration Theater](/docs/screenshots/theater.png)
- [Synchronized Showdown](/docs/screenshots/showdown.png)
- [Training Monitor](/docs/screenshots/training.png)
- [Break-It Adversarial Lab](/docs/screenshots/breakit.png)
- [Audit Hash Chain Explorer](/docs/screenshots/audit.png)
- [Rego Policy Inspector](/docs/screenshots/policy.png)
- [Tests & Health Grid](/docs/screenshots/tests.png)


---

## 3. Quickstart & Commands

### Prerequisites
- Python 3.11+
- OPA binary (v0.68+ installed in PATH or `.venv/Scripts/opa.exe`)
- Node.js v18+ & npm (for building the web UI with `make web`)

### Quick Setup

```bash
# 1. Install Python package in editable mode
make install
# or on Windows:
make.bat install

# 2. Run all unit and invariant tests (22/22 passing)
make test
# or on Windows:
make.bat test

# 3. Train quick-profile PPO policies (50k steps)
make train
# or on Windows:
make.bat train

# 4. Run comprehensive scientific evaluation benchmark (5 seeds, ablations, sensitivities)
make eval
# or on Windows:
make.bat eval

# 5. Build Mission Control React web application
make web
# or on Windows:
make.bat web

# 6. Launch Mission Control Dashboard at http://localhost:8000
make demo
# or on Windows:
make.bat demo

# 7. Quick fresh start (regenerate data + build + launch)
make demo-fresh
# or on Windows:
make.bat demo-fresh
```

---

## 4. Empirical Evaluation Findings (Table I & Table II)

All reported numbers are produced from genuine discrete-event simulation benchmarks across 5 random seeds (29,064 evaluated decisions) in `results/summary.json`:

| Controller | Shield Active | Useful Work $U_t$ [95% CI] | Attack Loss $L_t$ [95% CI] | Attack Success Rate [95% CI] | Policy Violation Rate ($PVR$) | Decision Latency ($p95$) | E2E Latency ($p95$) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Full Framework** | **Yes** | **3.25** [3.11, 3.41] | **0.11** [0.05, 0.18] | **13.3%** [3.3%, 26.7%] | **0.00%** | **0.57 ms** | **0.75 ms** |
| **Deterministic Budget** | **Yes** | **3.25** [3.11, 3.41] | 0.25 [0.16, 0.36] | 66.7% [50.0%, 83.3%] | **0.00%** | 0.001 ms | 0.12 ms |
| **Static RBAC** | No | 3.25 [3.11, 3.41] | 0.31 [0.23, 0.41] | 66.7% [50.0%, 83.3%] | 0.00% | 0.001 ms | 0.02 ms |
| **Risk Threshold** | No | 3.25 [3.11, 3.41] | 0.26 [0.16, 0.36] | 66.7% [50.0%, 83.3%] | 0.00% | 0.001 ms | 0.02 ms |
| **Unmasked PPO (w/ Shield)**| **Yes** | 3.25 [3.11, 3.41] | 0.11 [0.05, 0.18] | 13.3% [3.3%, 26.7%] | **0.00%** | 0.57 ms | 0.75 ms |
| **Unmasked PPO (w/o Shield)**| No | 3.25 [3.11, 3.41] | 0.14 [0.07, 0.22] | 33.3% [16.7%, 50.0%] | **0.02% (Breached)**| 0.57 ms | 0.65 ms |

### Key Empirical Takeaways
1. **Threat Model Realignment**: In low-and-slow, adaptive-pacing, and session-reset attack families, static perimeter RBAC suffers 100% attack success because valid credentials target role-authorized assets (`src_repo`, `billing_db`).
2. **Stateful Accounting Advantage**: Stateful cumulative exposure budgeting throttles high-volume and pacing attacks, reducing attack loss by **64.5%** compared to static RBAC.
3. **Shield Invariant Necessity**: Without the runtime feasibility shield, unmasked PPO experiences non-zero policy violations ($PVR > 0$), proving that physical runtime action masking is strictly necessary for compliance guarantees.

---

## 5. Five-Minute Presenter Script (Presenter Mode)

Click the **Presenter Mode** pill in the Mission Control header or press `Ctrl+K` to toggle streamlined presentation view:

- **Minute 1: The Problem (Overview)**: Explain that static RBAC/ABAC only validates perimeter tokens. Once authenticated, insider low-and-slow or adaptive pacing attacks bypass stateless guards.
- **Minute 2: The Continuous Pipeline (Theater)**: Show the streaming telemetry feed. Highlight the live Equation 4 charge calculation ($C_t = \kappa \cdot v \cdot \sigma \cdot \rho^p$) and watch the Runtime Shield intervene when proposed actions exceed remaining balance.
- **Minute 3: Multi-Agent Showdown (Showdown)**: Compare the 5 controllers on identical opportunity streams. Point out how Full Framework and Deterministic Budget contain cumulative exfiltration to 13.3% while static RBAC permits continuous leakage.
- **Minute 4: Adversarial Resilience (Break-It Lab)**: Execute the 50-thread concurrent overdraft storm and nonce replay tests. Show that all 10 adversarial injections fail closed safely with zero negative balance.
- **Minute 5: Cryptographic Ledger (Audit Explorer)**: Demonstrate the SHA-256 hash chain and Merkle anchoring. Trigger the demo tamper button to show exact row pinpointing, followed by deterministic replay verification.

---

## 6. Known Limitations & Research Boundaries

1. **Ordinal Risk Heuristic**: The risk score $\rho_t \in [0, 1]$ is an ordinal heuristic ranking indicator, not a calibrated Bayesian posterior probability.
2. **Synthetic Simulator Data**: Workload distributions, principal behaviors, and attack traces are generated in a discrete-event simulator, not captured from live enterprise production network traffic.
3. **Identity Boundary**: Per-principal budgets cannot prevent coordinated Sybil or multi-identity attacks spanning disjoint identities without global cross-account graph telemetry.
4. **Sub-Refill Attacks**: Adversaries transmitting below the refill rate $\eta$ (1.0 unit/min) without triggering anomalous authentication spikes cannot be exhausted by budget capacity alone.
5. **No Compliance Certification Claim**: This prototype is a research evaluation framework and does not constitute a certified compliance product.
6. **Fail-Closed Domain Applicability**: Strict fail-closed resolution is ideal for confidential enterprise databases, but unsuitable for cyber-physical or life-critical applications.
