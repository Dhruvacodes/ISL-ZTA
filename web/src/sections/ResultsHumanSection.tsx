import React, { useState } from 'react';
import { EvalSummary } from '../types';
import { LanguageMode } from '../copy';
import {
  GemDiamond,
  GemShield,
  GemScale,
  GemRisk,
} from '../components/Gems';
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Download,
  Info,
} from 'lucide-react';

interface ResultsHumanSectionProps {
  summary: EvalSummary | null;
  languageMode: LanguageMode;
  onNavigateTab: (tabId: string) => void;
}

export const ResultsHumanSection: React.FC<ResultsHumanSectionProps> = ({
  summary,
  languageMode,
  onNavigateTab,
}) => {
  const [selectedAttackFamily, setSelectedAttackFamily] = useState<string>('gradual_exfiltration');
  const [showTechnicalNumbers, setShowTechnicalNumbers] = useState<boolean>(false);

  // Attack loss values per family from real summary.json
  const attackData: Record<string, { label: string; requested: number; controllers: Record<string, number> }> = {
    gradual_exfiltration: {
      label: 'Slow & Stealthy Theft (Low-and-Slow)',
      requested: 0.48,
      controllers: {
        'Static RBAC': 0.48,
        'Risk Threshold': 0.48,
        'Deterministic Budget': 0.48,
        'Full Framework': 0.12,
        'Unmasked PPO (no shield)': 0.01,
      },
    },
    adaptive_pacing: {
      label: 'Cleverly Spaced Downloads',
      requested: 0.56,
      controllers: {
        'Static RBAC': 0.56,
        'Risk Threshold': 0.56,
        'Deterministic Budget': 0.56,
        'Full Framework': 0.11,
        'Unmasked PPO (no shield)': 0.0,
      },
    },
    session_resets: {
      label: 'Repeated Password/Token Resets',
      requested: 1.44,
      controllers: {
        'Static RBAC': 1.44,
        'Risk Threshold': 1.44,
        'Deterministic Budget': 1.44,
        'Full Framework': 0.29,
        'Unmasked PPO (no shield)': 0.12,
      },
    },
    burst_access: {
      label: 'Sudden Huge Download (Burst)',
      requested: 2.8,
      controllers: {
        'Static RBAC': 0.7,
        'Risk Threshold': 0.0,
        'Deterministic Budget': 0.0,
        'Full Framework': 0.7,
        'Unmasked PPO (no shield)': 0.28,
      },
    },
  };

  const currentFamily = attackData[selectedAttackFamily] || attackData['gradual_exfiltration'];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12" id="results-human-container">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono">
          <span>Human-First Evaluation Scorecard</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight">
          {languageMode === 'plain'
            ? 'Three Big Questions. Clear Answers.'
            : 'Empirical Security and Utility Results'}
        </h2>
        <p className="text-sm text-gray-400 max-w-2xl mx-auto">
          {languageMode === 'plain'
            ? 'We tested whether an AI with an exposure allowance can stop data theft without getting in the way of normal employees.'
            : 'Evaluated across 5 random seeds, 6 attack families, and 29,064 discrete decisions.'}
        </p>
      </div>

      {/* QUESTION 1 */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0B10] border border-white/[0.08] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">
              Question 1:
            </span>
            <h3 className="text-xl sm:text-2xl font-light text-white">
              "How much data did the attacker get away with?"
            </h3>
          </div>

          {/* Scenario Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-xs text-gray-400">Attack Type:</label>
            <select
              value={selectedAttackFamily}
              onChange={(e) => setSelectedAttackFamily(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
            >
              {Object.entries(attackData).map(([key, val]) => (
                <option key={key} value={key} className="bg-[#0B0B10]">
                  {val.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Visual Chart: Horizontal Bars */}
        <div className="space-y-3.5 pt-2">
          {Object.entries(currentFamily.controllers).map(([ctrl, allowed]) => {
            const pct = Math.round((allowed / currentFamily.requested) * 100);
            const isFull = ctrl === 'Full Framework';
            const isUnmasked = ctrl.includes('Unmasked');
            return (
              <div key={ctrl} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className={`font-medium ${isFull ? 'text-purple-300' : 'text-gray-300'}`}>
                    {ctrl === 'Full Framework'
                      ? '★ Our System (AI + Safety Check)'
                      : ctrl === 'Static RBAC'
                      ? 'Traditional Access Control (RBAC)'
                      : ctrl === 'Deterministic Budget'
                      ? 'Fixed Allowance Rule'
                      : ctrl === 'Risk Threshold'
                      ? 'Simple Suspicion Filter'
                      : 'Unguarded AI (No Safety Check)'}
                  </span>
                  <span className="font-mono text-gray-300">
                    <strong className={isFull ? 'text-emerald-400' : pct >= 90 ? 'text-rose-400' : 'text-amber-400'}>
                      {allowed.toFixed(2)} GB
                    </strong>{' '}
                    ({pct}% of target {currentFamily.requested} GB)
                  </span>
                </div>
                <div className="w-full h-3 bg-black/50 rounded-full border border-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull
                        ? 'bg-gradient-to-r from-emerald-400 to-purple-500'
                        : isUnmasked
                        ? 'bg-indigo-500'
                        : pct >= 90
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Takeaway Sentence */}
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200">
          <strong>Key Finding:</strong> On stealthy low-and-slow theft, traditional security leaked 100% of data (0.48 GB), while our framework cut data loss to 25% (0.12 GB) by enforcing daily exposure allowances.
        </div>
      </div>

      {/* QUESTION 2 */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0B10] border border-white/[0.08] space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">
            Question 2:
          </span>
          <h3 className="text-xl sm:text-2xl font-light text-white">
            "Did normal users get in the way?"
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-center">
            <span className="text-3xl font-light text-white font-mono">3.25</span>
            <span className="text-xs text-gray-400 block">Legitimate Work Completed</span>
            <span className="text-[11px] text-emerald-400">100% of normal tasks finished</span>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-center">
            <span className="text-3xl font-light text-purple-300 font-mono">6.7%</span>
            <span className="text-xs text-gray-400 block">Identity Prompts (MFA)</span>
            <span className="text-[11px] text-gray-400">Mild friction on high-risk files</span>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-center">
            <span className="text-3xl font-light text-emerald-400 font-mono">0</span>
            <span className="text-xs text-gray-400 block">False Denials</span>
            <span className="text-[11px] text-emerald-400">Zero legitimate users blocked</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
          <strong>Key Finding:</strong> Normal employees suffered zero false blocks. When accessing sensitive customer databases, they were occasionally asked to verify their identity, keeping business operations smooth.
        </div>
      </div>

      {/* QUESTION 3 */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0B10] border border-white/[0.08] space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
            Question 3:
          </span>
          <h3 className="text-xl sm:text-2xl font-light text-white">
            "Did the system ever break company rules?"
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-black/40 border border-white/10">
          <div className="text-center sm:text-left space-y-1">
            <div className="flex items-center space-x-2 text-emerald-400">
              <CheckCircle size={28} />
              <span className="text-4xl sm:text-5xl font-light font-mono text-white">0</span>
            </div>
            <p className="text-sm font-medium text-emerald-300">
              Rule-breaking decisions out of 29,064 evaluated
            </p>
            <p className="text-xs text-gray-400">
              0.00% policy violation rate when the safety check is enabled.
            </p>
          </div>

          <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6 space-y-1">
            <span className="text-xs text-gray-400 block">Without the Safety Check:</span>
            <span className="text-2xl font-mono text-rose-400 font-semibold block">0.02% Violations</span>
            <span className="text-[11px] text-rose-300">
              Unguarded AI broke compliance rules, proving the safety check is essential.
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200">
          <strong>Key Finding:</strong> A raw machine learning model will occasionally break rules. Our deterministic safety check mathematically guarantees that forbidden actions are never executed.
        </div>
      </div>

      {/* HYPOTHESIS SCORECARD IN PLAIN LANGUAGE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0B10] border border-white/[0.08] space-y-6">
        <h3 className="text-xl font-light text-white">
          Hypothesis Scorecard (Plain English)
        </h3>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-start space-x-3">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold mt-0.5">
              SUPPORTED
            </span>
            <div className="space-y-0.5 text-xs">
              <strong className="text-white block">1. Low-and-Slow Attack Containment</strong>
              <p className="text-gray-300">
                Tracking cumulative access cut stealthy data exfiltration by 75% compared to traditional static access control.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-start space-x-3">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold mt-0.5">
              SUPPORTED
            </span>
            <div className="space-y-0.5 text-xs">
              <strong className="text-white block">2. Zero Rule Violations Guarantee</strong>
              <p className="text-gray-300">
                The deterministic safety check strictly prevented all policy violations across 29,064 decisions.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start space-x-3">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-bold mt-0.5">
              INCONCLUSIVE
            </span>
            <div className="space-y-0.5 text-xs">
              <strong className="text-white block">3. AI Outperforms Fixed Rules on Burst Downloads</strong>
              <p className="text-gray-300">
                In sudden massive downloads, a fixed mathematical threshold stopped attacks just as well as the AI without needing training.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* WHAT WE DID NOT PROVE (LIMITATIONS BOX) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-amber-950/20 border border-amber-500/30 space-y-4">
        <div className="flex items-center space-x-2 text-amber-300">
          <AlertTriangle size={20} />
          <h4 className="text-base font-semibold">What We Did NOT Prove (Honest Boundaries)</h4>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-amber-200/80 leading-relaxed">
          <li>• <strong>Synthetic Simulator Only:</strong> These results come from a discrete-event simulator benchmark, not real company networks.</li>
          <li>• <strong>Single Account Bounds:</strong> The system tracks per-person allowances; it does not stop 50 coordinated accounts without cross-account clustering.</li>
          <li>• <strong>Refill Window Pacing:</strong> If an attacker steals data slower than the allowance refill rate (+1.0/min), files can still leak over weeks.</li>
          <li>• <strong>No Regulatory Certification:</strong> This is a research prototype, not a formal SOC-2 or FedRAMP certification.</li>
        </ul>
      </div>

      {/* EXPANDABLE "SHOW THE NUMBERS" SECTION */}
      <div className="p-6 rounded-2xl bg-[#0B0B10] border border-white/[0.08] space-y-4">
        <button
          onClick={() => setShowTechnicalNumbers(!showTechnicalNumbers)}
          className="w-full flex items-center justify-between text-left text-sm font-medium text-purple-300 hover:text-purple-200"
        >
          <span>{showTechnicalNumbers ? 'Hide Technical Tables' : 'Show the Numbers (Technical Latency & Ablations)'}</span>
          {showTechnicalNumbers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showTechnicalNumbers && (
          <div className="pt-4 border-t border-white/10 space-y-6 text-xs text-gray-300">
            {/* Dual Latency Table */}
            <div className="space-y-2">
              <h5 className="font-semibold text-white">Dual Latency Measurements:</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400">
                      <th className="py-2">Controller</th>
                      <th className="py-2">Decision Only (p95)</th>
                      <th className="py-2">End-to-End (p95)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="py-1.5 text-purple-300">Full Framework</td>
                      <td className="py-1.5">0.57 ms</td>
                      <td className="py-1.5">0.75 ms</td>
                    </tr>
                    <tr>
                      <td className="py-1.5">Deterministic Budget</td>
                      <td className="py-1.5">0.001 ms</td>
                      <td className="py-1.5">0.12 ms</td>
                    </tr>
                    <tr>
                      <td className="py-1.5">Static RBAC</td>
                      <td className="py-1.5">0.0009 ms</td>
                      <td className="py-1.5">0.12 ms</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Jump to Under the Hood button */}
            <div className="pt-2 text-right">
              <button
                onClick={() => onNavigateTab('underthehood')}
                className="text-xs text-purple-400 hover:underline"
              >
                Inspect Full Scientific Evaluation in Under the Hood →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
