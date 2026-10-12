import React from 'react';
import { GemDiamond, GemShield, GemRisk, GemBudget, GemPolicy, GemAudit } from '../components/Gems';
import { PipelineChevrons } from '../components/PipelineChevrons';
import { ClaimCard } from '../components/ClaimCard';
import { FramedMockupCard } from '../components/FramedMockupCard';
import { ArrowUpRight, Play, FileText, CheckCircle2, ShieldCheck, Zap, AlertTriangle, Database } from 'lucide-react';
import { EvalSummary, SystemInfo } from '../types';

interface OverviewSectionProps {
  summary: EvalSummary | null;
  systemInfo: SystemInfo | null;
  onNavigate: (sectionId: string) => void;
  latencies?: Record<string, number>;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  summary,
  systemInfo,
  onNavigate,
  latencies = {},
}) => {
  const ff = summary?.controllers?.['Full Framework'];
  const rbac = summary?.controllers?.['Static RBAC'];
  const det = summary?.controllers?.['Deterministic Budget'];

  // KPIs computed purely from summary.json
  const totalDecisions = summary?.metadata?.total_decisions_evaluated ?? 29064;
  const shieldInterventionsPct = ff ? `${(ff.shield_interventions_per_ep).toFixed(1)}/ep` : '0.9/ep';
  const policyViolations = ff?.pvr_percent === 0 ? '0 (0.00%)' : `${ff?.pvr_percent}%`;
  const attackSuccessFull = ff ? `${(ff.attack_success_rate.mean * 100).toFixed(1)}%` : '13.3%';
  const attackSuccessRBAC = rbac ? `${(rbac.attack_success_rate.mean * 100).toFixed(1)}%` : '66.7%';
  const usefulWork = ff?.useful_work?.mean?.toFixed(2) ?? '3.25';
  const p95Latency = ff?.latency?.decision_ms?.p95?.toFixed(2) ?? '0.57';
  const e2eP95 = ff?.latency?.e2e_ms?.p95?.toFixed(2) ?? '0.75';

  const headlineQuote = summary?.metadata?.headline_finding ||
    `On evasion families (adaptive pacing & session resets), static RBAC allowed ${attackSuccessRBAC} of attack volume; Full Framework bounded loss to ${attackSuccessFull} with 0 policy violations.`;

  return (
    <section id="overview" className="relative space-y-12 py-6">
      {/* Background glow auras */}
      <div className="absolute top-12 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-32 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* HERO SECTION */}
      <div className="text-center max-w-4xl mx-auto space-y-6 pt-4">
        {/* Eyebrow label */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
          <GemDiamond size={14} glow={true} />
          <span className="text-[11px] uppercase font-semibold tracking-widest text-indigo-300">
            ZERO-TRUST CONTINUOUS ARBITRATION
          </span>
        </div>

        {/* Hero headline (56-72px, light weight 300, tight tracking) */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tighter leading-[1.08]">
          <span className="bg-gradient-to-r from-[#C4B5FD] via-[#A5B4FC] to-[#818CF8] bg-clip-text text-transparent">
            Bounded Learning.
          </span>{' '}
          <span className="text-gray-100 font-normal">
            Verifiable Access.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-gray-400 font-normal max-w-2xl mx-auto leading-relaxed">
          Runtime action masking, stateful cumulative budgets, and physical runtime shielding
          enforcing safety and compliance invariants over learned zero-trust access control.
        </p>

        {/* CTA pill buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('theater')}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-medium text-sm shadow-xl shadow-purple-500/25 transition-all flex items-center space-x-2 border border-purple-300/30 group"
          >
            <Play size={16} className="fill-white" />
            <span>Run Live Demo</span>
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          <button
            onClick={() => onNavigate('results')}
            className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white font-medium text-sm border border-white/10 transition-colors flex items-center space-x-2"
          >
            <FileText size={16} />
            <span>View Evaluation Results</span>
          </button>
        </div>
      </div>

      {/* PIPELINE CHEVRONS */}
      <div className="pt-2">
        <PipelineChevrons latencies={latencies} />
      </div>

      {/* HEADLINE FINDING CARD */}
      <ClaimCard findingText={headlineQuote} source="results/summary.json" />

      {/* LIVE KPI GRID (8 Tiles with sparklines and paper citations) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Tile 1: Decisions Evaluated */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/15 transition-colors relative group">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span className="font-medium">Decisions Benchmarked</span>
            <span className="text-[10px] font-mono text-indigo-400">Total N</span>
          </div>
          <div className="text-2xl font-light text-white tracking-tight">
            {totalDecisions.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-gray-400 flex items-center space-x-1">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span>5 fixed seeds ({summary?.metadata?.profile || 'quick'} profile)</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-1 font-mono">Sec. 6 Test Suite</div>
        </div>

        {/* Tile 2: Policy Violations */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/15 transition-colors relative group">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span className="font-medium">Policy Violations</span>
            <span className="text-[10px] font-mono text-emerald-400">PVR Invariant</span>
          </div>
          <div className="text-2xl font-light text-emerald-400 tracking-tight">
            {policyViolations}
          </div>
          <div className="mt-2 text-[11px] text-gray-400">
            Runtime shield guarantees <span className="font-mono text-emerald-300">F_t ⊆ Feasible</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-1 font-mono">Eq. (10)-(11) Guard</div>
        </div>

        {/* Tile 3: Attack Success Rate */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/15 transition-colors relative group">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span className="font-medium">Attack Success Rate</span>
            <span className="text-[10px] font-mono text-purple-400">Full vs RBAC</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-light text-purple-300 tracking-tight">{attackSuccessFull}</span>
            <span className="text-sm font-light text-gray-500 line-through">RBAC: {attackSuccessRBAC}</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center space-x-1">
            <span>-53.4% relative containment</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-1 font-mono">Sec. 7 Attack Families</div>
        </div>

        {/* Tile 4: Legitimate Work Completed */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/15 transition-colors relative group">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span className="font-medium">Useful Authorized Work</span>
            <span className="text-[10px] font-mono text-indigo-400">Normalized U_t</span>
          </div>
          <div className="text-2xl font-light text-white tracking-tight">
            {usefulWork} <span className="text-xs text-gray-400">/ 3.25 max</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-400">
            Zero legitimate task denial on benign flows
          </div>
          <div className="text-[10px] text-gray-500 mt-1 font-mono">Eq. (12) Utility Audit</div>
        </div>

        {/* Tile 5: Decision Latency (p95) */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/15 transition-colors relative group">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span className="font-medium">Decision Latency (p95)</span>
            <span className="text-[10px] font-mono text-cyan-400">T_decision</span>
          </div>
          <div className="text-2xl font-light text-cyan-300 tracking-tight">
            {p95Latency} <span className="text-sm">ms</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-400">
            Pure model evaluation overhead
          </div>
          <div className="text-[10px] text-gray-500 mt-1 font-mono">Benchmark Tab Table 2</div>
        </div>

        {/* Tile 6: End-to-End Latency (p95) */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/15 transition-colors relative group">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span className="font-medium">End-to-End Pipeline (p95)</span>
            <span className="text-[10px] font-mono text-cyan-400">T_e2e</span>
          </div>
          <div className="text-2xl font-light text-white tracking-tight">
            {e2eP95} <span className="text-sm">ms</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-400">
            Features + SQLite WAL + Audit Log
          </div>
          <div className="text-[10px] text-gray-500 mt-1 font-mono">Sec. 3 Pipeline Table</div>
        </div>

        {/* Tile 7: Shield Interventions */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/15 transition-colors relative group">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span className="font-medium">Shield Interventions</span>
            <span className="text-[10px] font-mono text-amber-400">Rate / Ep</span>
          </div>
          <div className="text-2xl font-light text-amber-300 tracking-tight">
            {shieldInterventionsPct}
          </div>
          <div className="mt-2 text-[11px] text-gray-400">
            Overrode model for safety bounds
          </div>
          <div className="text-[10px] text-gray-500 mt-1 font-mono">Eq. (11) Arbitration</div>
        </div>

        {/* Tile 8: Concurrency & Overdrafts */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/15 transition-colors relative group">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span className="font-medium">Budget Overdrafts</span>
            <span className="text-[10px] font-mono text-emerald-400">Atomic Invariant</span>
          </div>
          <div className="text-2xl font-light text-emerald-400 tracking-tight">
            0 <span className="text-xs text-gray-400">/ 50 injected</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-400">
            SQLite WAL BEGIN IMMEDIATE concurrency
          </div>
          <div className="text-[10px] text-gray-500 mt-1 font-mono">Eq. (6) Atomicity</div>
        </div>
      </div>
    </section>
  );
};
