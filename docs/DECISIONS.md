# Design Decisions and Defaults

This document records sensible defaults, design decisions, and architectural choices made where the project specification left room for interpretation.

## 1. Ground Rules and Notation
- **Synthetic Simulator Disclaimer**: All evaluations and reported figures are explicitly labelled as synthetic discrete-event simulation results and not measured enterprise production traffic.
- **Fail Closed Principle**: Any unhandled exception, schema mismatch, validation error, policy engine error, missing evidence, timeout, or lock failure immediately resolves to `Action.DENY`.
- **Equation Citations**: All mathematical formulas and component behaviors cite the corresponding equations from the methodology (e.g., `# Eq. (1)`, `# Eq. (4)`).

## 2. Request and State Representation (Eq. 1 & 2)
- **Prototype Maximum Volume**: Normalized volume $\nu_t \in [0, 1]$ assumes a maximum prototype volume of 1,000 megabytes (1 GB). A request specifying raw byte volume is normalized by $\min(1.0, \text{bytes} / 10^9)$.
- **Hour of Day Encoding**: Cyclic time features are encoded as $\sin(2\pi \cdot \text{hour} / 24)$ and $\cos(2\pi \cdot \text{hour} / 24)$ where hour is derived from timestamp $\tau_t$.
- **History Feature Windows**: Two sliding windows are tracked per principal: 5 minutes (300 seconds) and 1 hour (3600 seconds). Tracked metrics are: request count, total transferred volume, distinct resources accessed, challenge failures, and prior intervention count.
- **Normalization Strategy**: Normalization statistics (mean, standard deviation or min/max) are fitted strictly on the training partition and saved alongside model checkpoints (`norm_stats.json`). Unseen features at test time are clipped to standard deviations.

## 3. Risk Estimator (Eq. 3)
- **Interpretation**: $\rho_t \in [0, 1]$ is treated strictly as an ordinal risk index, not a calibrated Bayesian probability.
- **Feature Weights**: The validation split tunes weights across four normalized indicator features:
  - $x_{\text{auth}}$: Authentication anomaly (recent failed attempts, unexpected device).
  - $x_{\text{posture}}$: Device weakness ($1 - \text{posture\_score}$).
  - $x_{\text{pattern}}$: Volume and novelty anomaly relative to role baseline.
  - $x_{\text{alert}}$: Historical unresolved security alerts.
  Default weights: $w = [0.35, 0.25, 0.25, 0.15]$ (sum to 1.0).

## 4. Budget Accounting and Atomicity (Eq. 4-6)
- **Default Parameters**: $\kappa = 10$, $p = 2$, $B_{\max} = 100$, refill rate $\eta = 1.0 \text{ unit/minute}$ ($1/60 \text{ unit/second}$).
- **Action Volume Factors $v_t(a)$**:
  - `ALLOW`: $v = \nu_t$ (requested volume).
  - `RESTRICT`: $v = 0.25 \times \nu_t$ (capped at read-only reduced scope).
  - `MFA`, `DENY`, `QUARANTINE`: $v = 0.0$.
- **Database Engine**: SQLite with Write-Ahead Logging (`PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;`).
- **Atomic Operations**: `BEGIN IMMEDIATE` transaction ensures exclusive write access during reservation. Reservations are keyed on `request_id` to guarantee idempotent repeated evaluations.
- **Multi-Session Sharing**: Budget is keyed by `principal_id`, neutralizing session-reset bypass attacks.

## 5. Policy Engine and Shield (Eq. 7-11)
- **Policy Mask $m_t$**: Evaluated via Rego bundle (if OPA CLI is present) or the pure-Python reference evaluator. In both cases, actions with missing authorization or rule violations receive 0. `DENY` is hard-coded to 1 at platform level regardless of policy failure.
- **Sensitivity Thresholds $\delta(r_t)$**:
  - Low sensitivity ($\sigma \approx 0.2$): $\delta = 1.0$.
  - Medium sensitivity ($\sigma \approx 0.6$): $\delta = 0.6$.
  - High sensitivity ($\sigma \approx 1.0$): $\delta = 0.3$.
- **Evidence Freshness Threshold**: Evidence older than 300 seconds ($H_t(a) = 0$) disqualifies non-DENY actions.
- **Authorization Binding**: Authorizations contain HMAC-SHA256 nonces and UUID tokens binding principal, resource, action, permitted volume, timestamp, expiry (60 seconds), and policy version hash.

## 6. Audit Logging and Hash Chain
- **Storage**: SQLite table `audit_log` and append-only JSONL files.
- **Chain Verification**: Each record computes $h_k = \text{SHA256}(h_{k-1} \,\|\, \text{canonical\_json}(R_k))$.
- **Batch Anchoring**: Every 100 records, a Merkle root anchor is computed and stored.
- **Terminal Enforcement Ack**: A write-ahead record is logged before authorization issuance; the Policy Enforcement Point (PEP) updates the record with terminal status (`ACKED`, `REJECTED_PEP`, `EXPIRED`, `TAMPERED`).

## 7. Reward Function and Reinforcement Learning (Eq. 12-13)
- **Reward Formulation**: $r_t = w_u U_t - w_l L_t - w_f F_t - w_i I_t$.
  - $w_u = 1.0$ (useful authorized work completed).
  - $w_l = 2.0$ (delayed realized attack impact: exfiltrated volume $\times$ sensitivity).
  - $w_f = 0.5$ (user friction: false denial, unnecessary MFA challenge, unwarranted quarantine).
  - $w_i = 0.2$ (shield intervention penalty when proposal is infeasible).
- **PPO Likelihood Invariant**: In Gymnasium environment step, the policy proposes $\tilde{a}_t$, the shield computes $a_t \in \mathcal{F}_t$, execution runs $a_t$, and the Gym step returns the environment outcome while logging $\tilde{a}_t$ and $a_t$ in `info`. Rollout buffer preserves $\tilde{a}_t$ to maintain likelihood ratio correctness under action masking.

## 8. Simulator and Baselines
- **Splits**: 100 synthetic principals split 60/20/20 into train/validation/test partitions.
- **Event Reproducibility**: Scenario opportunity streams are pre-generated with fixed seeds so that all 5 controllers experience identical sequence of opportunities.
- **Limitation Acknowledgment**: Coordinated multi-identity attacks spanning disjoint synthetic principals are recorded as a fundamental architectural boundary for per-principal budget mechanisms.

## 9. Evaluation Realignment and Threat Model Calibration (Part A)
- **Role-Authorized Insider Targeting**: To meaningfully test Zero-Trust continuous arbitration against static RBAC, insider threat models were redesigned to request role-authorized resources (`src_repo` for Engineering, `billing_db` for Finance, `customer_profile` for Support, `quarterly_reports` for Executive) with valid tokens. This prevents static RBAC from trivially blocking attacks at the perimeter and tests continuous post-admission exfiltration detection.
- **Budget Scaling Factor $\kappa$**: Calibrated to $\kappa = 1500.0$ (with $B_{\max} = 100.0$, refill $\eta = 1.0/\text{min}$, $p = 2$). This scaling ensures that routine authorized benign requests incur modest charges ($C_t \approx 0.1 - 0.5$), while high-volume or high-risk bursts rapidly deplete capacity, forcing shield intervention ($a_t \in \mathcal{F}_t$) before critical data is exfiltrated.
- **Baseline Tuning Search Space**:
  - `RiskThresholdController`: Evaluated over grid $\theta_{\text{allow}} \in [0.20, 0.45]$, $\theta_{\text{mfa}} \in [0.35, 0.65]$, $\theta_{\text{restrict}} \in [0.60, 0.85]$. Best validation trade-off: $\theta_{\text{allow}} = 0.30, \theta_{\text{mfa}} = 0.45, \theta_{\text{restrict}} = 0.70$.
  - `DeterministicBudgetController`: Evaluated over grid $\theta_{\text{allow}} \in [0.20, 0.45]$, $\theta_{\text{mfa}} \in [0.35, 0.65]$ with action selection strictly constrained to shield feasible set $\mathcal{F}_t$. Best validation trade-off: $\theta_{\text{allow}} = 0.30, \theta_{\text{mfa}} = 0.55$.
- **Utility Accounting Integrity**: Useful work $U_t$ is strictly restricted to benign workload requests ($U_t = \nu_t$ for ALLOW and benign MFA completions, with $F_t = 0.10$ user friction penalty). Attack containment is rewarded in RL training $r_t$ but excluded from useful work $U_t$, preventing artificial utility inflation.
- **Dual Latency Measurement**: Latency is reported across two explicit columns:
  1. $T_{\text{decision}}$: Pure algorithmic policy evaluation time.
  2. $T_{\text{e2e}}$: Complete request lifecycle overhead, including sliding window feature computation, SQLite WAL budget reservation transactions, shield invariant verification, and audit hash-chain persistence.

