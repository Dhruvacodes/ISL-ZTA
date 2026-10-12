import React, { useState } from 'react';
import { FramedMockupCard } from '../components/FramedMockupCard';
import { GemDiamond, GemShield, GemRisk, GemBudget, GemPolicy, GemAudit, GemCpu, GemTerminal } from '../components/Gems';
import { BookOpen, Presentation, CheckCircle, ChevronRight, FileCode, Play, Sparkles } from 'lucide-react';

interface HowItWorksProps {
  presenterMode: boolean;
  onTogglePresenterMode: () => void;
  onAdvanceSection: (id: string) => void;
}

export const HowItWorksSection: React.FC<HowItWorksProps> = ({
  presenterMode,
  onTogglePresenterMode,
  onAdvanceSection,
}) => {
  const [activeStep, setActiveStep] = useState(0);

  const presenterScript = [
    {
      minute: "Minute 1: The Zero-Trust Problem (Section 0)",
      targetSection: "overview",
      script:
        "Welcome. Modern zero-trust perimeter architectures (RBAC/ABAC) authenticate identity at the boundary, but once credentials or sessions are established, they fail to prevent gradual, low-and-slow, or adaptive data exfiltration. As shown in our empirical findings, static RBAC leaks up to 100% of target volume under insider pacing. ZT-Arbiter solves this by introducing stateful cumulative budget depletion with runtime safety shielding.",
    },
    {
      minute: "Minute 2: Live Arbitration Theater (Section 1)",
      targetSection: "theater",
      script:
        "Here in the Live Theater, we observe continuous authorization in flight. Notice how each access request evaluates Eq. 3 ordinal risk, checks Rego action masks, and queries authoritative SQLite WAL budgets. When the PPO learner proposes an unconstrained access that would overspend capacity or violate posture thresholds, the Runtime Shield instantly intervenes, overriding the proposal to RESTRICT or DENY without crashing or leaking data.",
    },
    {
      minute: "Minute 3: Synchronized 5-Controller Showdown (Section 2)",
      targetSection: "showdown",
      script:
        "In the synchronized showdown, identical seeded opportunity streams run through all 5 controllers. Static RBAC and stateless risk threshold controllers permit data draining on adaptive pacing attacks. In contrast, our Full Framework and Deterministic Budget controllers physically throttle the adversary, bounding total exfiltration to 13.3% while maintaining 100% legitimate task utility.",
    },
    {
      minute: "Minute 4: The Break-It Resilience Lab (Section 5)",
      targetSection: "breakit",
      script:
        "Safety requires verified adversarial resilience. In the Break-It Lab, we test 10 adversarial boundary conditions: 50 simultaneous threads trying to overdraft one balance, replayed authorization nonces, expired tokens, mid-flight policy swaps, and OPA daemon timeouts. All 10 fail closed safely with zero negative balances and zero unauthorized transfers.",
    },
    {
      minute: "Minute 5: Cryptographic Audit Ledger & Conclusion (Section 6)",
      targetSection: "audit",
      script:
        "Every write-ahead decision is chained via SHA-256 with Merkle batch anchoring. Modifying any past record breaks the chain and pinpoints the exact tampered row. Offline replay matches historical records with zero diff. ZT-Arbiter provides provable safety, low latency (<0.75 ms), and continuous zero-trust containment.",
    },
  ];

  const conceptMappings = [
    {
      concept: "State & Observation Formulation",
      equations: "Eq. (1)-(2)",
      file: "src/ztarb/features.py",
      view: "Overview (Hero & KPIs)",
      desc: "Normalized volume nu_t, cyclic time, and 5m/1h sliding-window request statistics.",
    },
    {
      concept: "Risk Estimation Engine",
      equations: "Eq. (3)",
      file: "src/ztarb/risk.py",
      view: "Live Theater (Risk Trace)",
      desc: "Ordinal risk index rho_t evaluated across auth anomaly, posture, and alert history.",
    },
    {
      concept: "Stateful Budget & Atomicity",
      equations: "Eq. (4)-(6)",
      file: "src/ztarb/budget.py",
      view: "Policy & Budget (Playground)",
      desc: "Super-linear charge C_t = kappa * v * sigma * rho^p with SQLite WAL atomic reservation.",
    },
    {
      concept: "Rego Engine & Action Masking",
      equations: "Eq. (7)-(8)",
      file: "src/ztarb/policy_engine.py",
      view: "Policy & Budget (Rego Viewer)",
      desc: "Rego policy bundle compilation and Python reference parity evaluator.",
    },
    {
      concept: "Runtime Feasibility Shield",
      equations: "Eq. (10)-(11)",
      file: "src/ztarb/shield.py",
      view: "Live Theater & Break-It Lab",
      desc: "Authoritative feasibility set F_t computation and safety override arbitration.",
    },
    {
      concept: "RL Reward Formulation & Training",
      equations: "Eq. (12)-(13)",
      file: "src/ztarb/env.py, train.py",
      view: "Training Monitor",
      desc: "Reward balancing useful work, exfiltration loss, friction, and intervention penalty.",
    },
    {
      concept: "Write-Ahead Audit Hash Chain",
      equations: "Section 3.5",
      file: "src/ztarb/audit.py",
      view: "Audit Explorer",
      desc: "Append-only SHA-256 hash chain with Merkle batch anchoring and PEP ack updates.",
    },
  ];

  return (
    <section id="architecture" className="relative space-y-6 py-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen size={16} className="text-purple-400" />
            <span className="text-[11px] uppercase font-semibold tracking-wider text-purple-400">
              SECTION 10: METHODOLOGY & PRESENTER GUIDE
            </span>
          </div>
          <h2 className="text-3xl font-light tracking-tight text-white mt-1">
            Architecture, Equations & 5-Minute Pitch
          </h2>
          <p className="text-xs text-gray-400 max-w-xl mt-1">
            Section-by-section traceability from paper equations to codebase files, alongside an interactive
            guided presenter script that walks through the core demonstration narrative.
          </p>
        </div>

        {/* Presenter Mode Toggle Button */}
        <button
          onClick={onTogglePresenterMode}
          className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all ${
            presenterMode
              ? 'bg-purple-600/30 text-purple-200 border border-purple-400 shadow-lg shadow-purple-500/20'
              : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
          }`}
        >
          <Presentation size={15} className={presenterMode ? 'text-purple-300 animate-pulse' : ''} />
          <span>{presenterMode ? 'Exit Presenter Mode' : 'Enter 5-Min Presenter Mode'}</span>
        </button>
      </div>

      {/* 5-Minute Presenter Script Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-[#12121D] to-[#0A0A12] border border-purple-500/30 backdrop-blur-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles size={18} className="text-purple-400" />
            <h3 className="text-sm font-semibold text-white">5-Minute Interactive Presenter Script</h3>
          </div>
          <span className="text-[11px] font-mono text-purple-300">
            Slide {activeStep + 1} of {presenterScript.length}
          </span>
        </div>

        {/* Active Step Content */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-medium text-white tracking-tight">
              {presenterScript[activeStep].minute}
            </h4>
            <button
              onClick={() => onAdvanceSection(presenterScript[activeStep].targetSection)}
              className="px-3 py-1 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center space-x-1"
            >
              <span>Jump to Section</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed font-light pl-3 border-l-2 border-purple-400/60">
            "{presenterScript[activeStep].script}"
          </p>
        </div>

        {/* Step Navigation Dots & Arrows */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center space-x-2">
            {presenterScript.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  activeStep === idx
                    ? 'w-7 bg-purple-400'
                    : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              disabled={activeStep === 0}
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={activeStep === presenterScript.length - 1}
              onClick={() => setActiveStep((prev) => Math.min(presenterScript.length - 1, prev + 1))}
              className="px-3 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next Step
            </button>
          </div>
        </div>
      </div>

      {/* Paper-to-Code Mapping Table */}
      <div className="p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileCode size={16} className="text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Paper Equations → Codebase Traceability Map</h3>
          </div>
          <span className="text-[10px] font-mono text-gray-400">Strictly Preserved Invariants</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-[11px] font-mono">
                <th className="py-2.5 px-3">Methodology Component</th>
                <th className="py-2.5 px-3">Paper Citation</th>
                <th className="py-2.5 px-3">Codebase Implementation</th>
                <th className="py-2.5 px-3">Dashboard Section</th>
                <th className="py-2.5 px-3">Invariant Guarantee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {conceptMappings.map((cm, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-3 font-semibold text-white">{cm.concept}</td>
                  <td className="py-3 px-3 font-mono text-purple-300">{cm.equations}</td>
                  <td className="py-3 px-3 font-mono text-indigo-300">{cm.file}</td>
                  <td className="py-3 px-3 text-gray-300">{cm.view}</td>
                  <td className="py-3 px-3 text-[11px] text-gray-400">{cm.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
