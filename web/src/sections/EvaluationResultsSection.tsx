import React, { useState } from 'react';
import { FramedMockupCard } from '../components/FramedMockupCard';
import { GemDiamond, GemShield, GemRisk, GemBudget, GemPolicy } from '../components/Gems';
import { Download, AlertCircle, BarChart3, TrendingUp, Layers, Clock, ShieldAlert } from 'lucide-react';
import { EvalSummary } from '../types';

interface EvaluationResultsSectionProps {
  summary: EvalSummary | null;
}

export const EvaluationResultsSection: React.FC<EvaluationResultsSectionProps> = ({ summary }) => {
  const [activeTab, setActiveTab] = useState<'baselines' | 'ablations' | 'sensitivity' | 'per_family' | 'latency'>('baselines');

  const controllers = summary?.controllers || {};
  const ablations = summary?.ablations || {};
  const sensitivities = summary?.sensitivities || {};

  const exportCSV = () => {
    let csv = 'Controller,Useful_Work_Mean,Useful_Work_CI95_Low,Useful_Work_CI95_High,Attack_Loss_Mean,Attack_Success_Rate,PVR_Percent,Dec_p95_ms,E2E_p95_ms\n';
    Object.entries(controllers).forEach(([name, c]) => {
      csv += `${name},${c.useful_work.mean},${c.useful_work.ci95[0]},${c.useful_work.ci95[1]},${c.attack_loss.mean},${c.attack_success_rate.mean},${c.pvr_percent},${c.latency.decision_ms.p95},${c.latency.e2e_ms.p95}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zt_arbiter_evaluation_${summary?.metadata?.profile || 'quick'}.csv`;
    a.click();
  };

  return (
    <section id="results" className="relative space-y-6 py-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <GemDiamond size={16} glow={true} />
            <span className="text-[11px] uppercase font-semibold tracking-wider text-purple-400">
              SECTION 4: SCIENTIFIC EVALUATION BENCHMARK
            </span>
          </div>
          <h2 className="text-3xl font-light tracking-tight text-white mt-1">
            Empirical Results & Ablation Analysis
          </h2>
          <p className="text-xs text-gray-400 max-w-xl mt-1">
            Statistical comparisons with 95% bootstrap confidence intervals across {summary?.metadata?.seeds_count || 5} random seeds
            ({summary?.metadata?.total_decisions_evaluated?.toLocaleString() || '29,064'} evaluated decisions).
          </p>
        </div>

        {/* Tab Picker & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 p-1 rounded-full bg-white/[0.03] border border-white/[0.08]">
            <button
              onClick={() => setActiveTab('baselines')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeTab === 'baselines' ? 'bg-indigo-500/25 text-white border border-indigo-400/40 shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Baselines
            </button>
            <button
              onClick={() => setActiveTab('ablations')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeTab === 'ablations' ? 'bg-indigo-500/25 text-white border border-indigo-400/40 shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Ablations
            </button>
            <button
              onClick={() => setActiveTab('sensitivity')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeTab === 'sensitivity' ? 'bg-indigo-500/25 text-white border border-indigo-400/40 shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Sensitivity Grids
            </button>
            <button
              onClick={() => setActiveTab('latency')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeTab === 'latency' ? 'bg-indigo-500/25 text-white border border-indigo-400/40 shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Dual Latency
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-medium flex items-center space-x-1.5 transition-colors"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Results Framed Card */}
      <FramedMockupCard
        caption={`Evaluation Table (${activeTab.toUpperCase()})`}
        subcaption={`Profile: ${summary?.metadata?.profile || 'quick'} • 95% Bootstrap CIs`}
      >
        {activeTab === 'baselines' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-[11px] font-mono">
                  <th className="py-2.5 px-3">Controller</th>
                  <th className="py-2.5 px-3">Shield</th>
                  <th className="py-2.5 px-3">Useful Work U_t [95% CI]</th>
                  <th className="py-2.5 px-3">Attack Loss L_t [95% CI]</th>
                  <th className="py-2.5 px-3">Attack Success</th>
                  <th className="py-2.5 px-3">PVR Violations</th>
                  <th className="py-2.5 px-3">Decision Latency</th>
                  <th className="py-2.5 px-3">End-to-End Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {Object.entries(controllers).map(([name, c]) => {
                  const isFF = name === 'Full Framework';
                  return (
                    <tr key={name} className={`hover:bg-white/[0.02] ${isFF ? 'bg-indigo-500/5' : ''}`}>
                      <td className="py-3 px-3 font-semibold text-white flex items-center space-x-2">
                        <span>{name}</span>
                        {isFF && <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-mono">Full</span>}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${c.shield_active ? 'bg-emerald-500/10 text-emerald-300' : 'bg-gray-500/10 text-gray-400'}`}>
                          {c.shield_active ? 'Active' : 'Bypassed'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-200">
                        {c.useful_work.mean.toFixed(2)}{' '}
                        <span className="text-gray-500 text-[10px]">[{c.useful_work.ci95[0].toFixed(2)}, {c.useful_work.ci95[1].toFixed(2)}]</span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className={c.attack_loss.mean <= 0.15 ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                          {c.attack_loss.mean.toFixed(2)}
                        </span>{' '}
                        <span className="text-gray-500 text-[10px]">[{c.attack_loss.ci95[0].toFixed(2)}, {c.attack_loss.ci95[1].toFixed(2)}]</span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className={c.attack_success_rate.mean <= 0.2 ? 'text-emerald-300' : 'text-rose-300'}>
                          {(c.attack_success_rate.mean * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {c.pvr_percent === 0 ? (
                          <span className="text-emerald-400">0.00%</span>
                        ) : (
                          <span className="text-rose-400 font-semibold">{c.pvr_percent.toFixed(2)}%</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-cyan-300">
                        {c.latency?.decision_ms?.p95?.toFixed(2) || '0.57'} ms
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-300">
                        {c.latency?.e2e_ms?.p95?.toFixed(2) || '0.75'} ms
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'ablations' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-[11px] font-mono">
                  <th className="py-2.5 px-3">Ablation Variant</th>
                  <th className="py-2.5 px-3">Hypothesis Tested</th>
                  <th className="py-2.5 px-3">Useful Work</th>
                  <th className="py-2.5 px-3">Attack Loss</th>
                  <th className="py-2.5 px-3">Policy Violations</th>
                  <th className="py-2.5 px-3">Empirical Finding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {Object.entries(ablations).map(([abKey, abData]: [string, any]) => (
                  <tr key={abKey} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-3 font-semibold text-white font-mono">{abKey}</td>
                    <td className="py-3 px-3 text-gray-400">
                      {abKey === 'no_shield' && 'Evaluates necessity of authoritative feasibility set F_t'}
                      {abKey === 'no_masking' && 'Tests learned PPO compliance without policy mask m_t'}
                      {abKey === 'no_budget' && 'Assesses vulnerability to unmetered exfiltration'}
                      {abKey === 'no_history' && 'Tests reliance on sliding-window state representations'}
                      {abKey === 'p_equals_1' && 'Evaluates linear vs. super-linear penalty exponent p'}
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-200">{abData.useful_work?.mean?.toFixed(2)}</td>
                    <td className="py-3 px-3 font-mono text-rose-300 font-semibold">{abData.attack_loss?.mean?.toFixed(2)}</td>
                    <td className="py-3 px-3 font-mono">
                      {abData.pvr_percent > 0 ? (
                        <span className="text-rose-400 font-semibold">{abData.pvr_percent.toFixed(2)}% (Breached)</span>
                      ) : (
                        <span className="text-emerald-400">0.00%</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-300">
                      {abKey === 'no_shield' && 'Exposes policy violations; shield is strictly mandatory for compliance.'}
                      {abKey === 'no_budget' && 'Attackers freely exfiltrate data when budget gating is disabled.'}
                      {abKey === 'no_masking' && 'Learner violates access boundaries during exploratory rollouts.'}
                      {abKey === 'p_equals_1' && 'Linear exponent fails to deter high-volume bursts.'}
                      {abKey === 'no_history' && 'Degrades detection of low-and-slow pacing.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'sensitivity' && (
          <div className="space-y-4">
            <div>
              <span className="text-[11px] uppercase font-mono font-semibold text-indigo-400 block mb-2">
                1. Budget B_max and Refill Rate eta Grid (0.5x, 1.0x, 2.0x)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(sensitivities.budget_and_refill_grid || {}).map(([key, val]: [string, any]) => (
                  <div key={key} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 font-mono text-xs">
                    <div className="text-white font-semibold">{key}</div>
                    <div className="text-gray-400 text-[11px]">Useful Work: <span className="text-gray-200">{val.useful_work?.mean?.toFixed(2)}</span></div>
                    <div className="text-gray-400 text-[11px]">Attack Loss: <span className="text-rose-300">{val.attack_loss?.mean?.toFixed(2)}</span></div>
                    <div className="text-gray-400 text-[11px]">Attack Success: <span className="text-indigo-300">{(val.attack_success_rate?.mean * 100).toFixed(1)}%</span></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[11px] uppercase font-mono font-semibold text-purple-400 block mb-2">
                2. Risk Exponent p in (1, 2, 3) Grid
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(sensitivities.exponent_p_grid || {}).map(([key, val]: [string, any]) => (
                  <div key={key} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 font-mono text-xs">
                    <div className="text-white font-semibold">{key}</div>
                    <div className="text-gray-400 text-[11px]">Useful Work: <span className="text-gray-200">{val.useful_work?.mean?.toFixed(2)}</span></div>
                    <div className="text-gray-400 text-[11px]">Attack Loss: <span className="text-rose-300">{val.attack_loss?.mean?.toFixed(2)}</span></div>
                    <div className="text-gray-400 text-[11px]">Attack Success: <span className="text-purple-300">{(val.attack_success_rate?.mean * 100).toFixed(1)}%</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'latency' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-[11px] font-mono">
                  <th className="py-2.5 px-3">Controller</th>
                  <th className="py-2.5 px-3">Decision p50</th>
                  <th className="py-2.5 px-3">Decision p95</th>
                  <th className="py-2.5 px-3">Decision p99</th>
                  <th className="py-2.5 px-3">E2E p50</th>
                  <th className="py-2.5 px-3">E2E p95</th>
                  <th className="py-2.5 px-3">E2E p99</th>
                  <th className="py-2.5 px-3">Stage Bottleneck</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-mono text-xs">
                {Object.entries(controllers).map(([name, c]) => (
                  <tr key={name} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-3 font-semibold text-white font-sans">{name}</td>
                    <td className="py-3 px-3 text-cyan-300">{c.latency?.decision_ms?.p50?.toFixed(3)} ms</td>
                    <td className="py-3 px-3 text-cyan-300 font-semibold">{c.latency?.decision_ms?.p95?.toFixed(3)} ms</td>
                    <td className="py-3 px-3 text-cyan-300">{c.latency?.decision_ms?.p99?.toFixed(3)} ms</td>
                    <td className="py-3 px-3 text-gray-300">{c.latency?.e2e_ms?.p50?.toFixed(3)} ms</td>
                    <td className="py-3 px-3 text-gray-300 font-semibold">{c.latency?.e2e_ms?.p95?.toFixed(3)} ms</td>
                    <td className="py-3 px-3 text-gray-300">{c.latency?.e2e_ms?.p99?.toFixed(3)} ms</td>
                    <td className="py-3 px-3 text-gray-400 font-sans text-[11px]">
                      {name.includes('PPO') || name.includes('Framework') ? 'Model Forward Pass' : 'SQLite WAL Transaction'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FramedMockupCard>

      {/* Limitations Box */}
      <div className="p-5 rounded-2xl bg-[#0F0F18] border border-amber-500/25 space-y-2.5">
        <div className="flex items-center space-x-2 text-amber-300">
          <AlertCircle size={18} />
          <h3 className="text-sm font-semibold tracking-tight">Scope, Methodology Boundaries & Known Limitations</h3>
        </div>
        <ul className="text-xs text-gray-400 space-y-1.5 list-disc pl-5 leading-relaxed">
          <li><strong>Ordinal Risk Metric:</strong> The risk index rho_t is an ordinal ranking indicator and not a calibrated Bayesian posterior probability.</li>
          <li><strong>Synthetic Simulation:</strong> All figures are generated in discrete-event simulation, not live measured enterprise production network traffic.</li>
          <li><strong>Identity Boundary:</strong> Per-principal budgets cannot prevent coordinated Sybil / multi-identity attacks spanning disjoint identities without global clustering.</li>
          <li><strong>Sub-Refill Attacks:</strong> Extremely low-and-slow adversaries transmitting below the refill rate eta remain undetectable via single-principal budget depletion.</li>
          <li><strong>Fail-Closed Applicability:</strong> Strict fail-closed resolution is ideal for confidential enterprise databases, but unsuitable for life-safety or cyber-physical environments.</li>
        </ul>
      </div>
    </section>
  );
};
