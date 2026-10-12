import React, { useState } from 'react';
import { OverviewSection } from './OverviewSection';
import { LiveTheaterSection } from './LiveTheaterSection';
import { ShowdownSection } from './ShowdownSection';
import { TrainingMonitorSection } from './TrainingMonitorSection';
import { EvaluationResultsSection } from './EvaluationResultsSection';
import { BreakItLabSection } from './BreakItLabSection';
import { AuditExplorerSection } from './AuditExplorerSection';
import { PolicyBudgetSection } from './PolicyBudgetSection';
import { SimulatorSection } from './SimulatorSection';
import { TestsHealthSection } from './TestsHealthSection';
import { HowItWorksSection } from './HowItWorksSection';
import { SystemInfo, EvalSummary } from '../types';
import {
  GemTerminal,
  GemShield,
  GemZap,
  GemAudit,
  GemPolicy,
  GemRisk,
  GemDiamond,
} from '../components/Gems';

interface UnderTheHoodSectionProps {
  systemInfo: SystemInfo | null;
  summary: EvalSummary | null;
  presenterMode?: boolean;
}

export const UnderTheHoodSection: React.FC<UnderTheHoodSectionProps> = ({
  systemInfo,
  summary,
  presenterMode = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<string>('eval_results');

  const subTabs = [
    { id: 'eval_results', label: 'Evaluation Results & Tables' },
    { id: 'live_theater', label: 'Technical Theater' },
    { id: 'showdown', label: 'Showdown Replay' },
    { id: 'training', label: 'Training Monitor' },
    { id: 'breakit', label: 'Break-It Lab (Failures)' },
    { id: 'audit', label: 'Audit Explorer' },
    { id: 'policy', label: 'Policy & Rego Inspector' },
    { id: 'simulator', label: 'Simulator Manifest' },
    { id: 'tests', label: 'Tests & Health' },
    { id: 'architecture', label: 'Architecture & Equations' },
    { id: 'overview', label: 'System Overview' },
  ];

  return (
    <div className="w-full space-y-8" id="underthehood-container">
      {/* Header banner */}
      <div className="p-6 rounded-3xl bg-[#0B0B10] border border-white/[0.08] space-y-3">
        <div className="flex items-center space-x-2 text-purple-400">
          <GemTerminal size={18} glow={true} />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Technical Subsystem & Engineering Inspector
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
          Under the Hood: Deep Architecture & Test Lab
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 max-w-3xl leading-relaxed">
          Access raw mathematical models, PPO loss telemetry, cryptographic chain verifiers,
          Rego OPA policy trees, failure injection harnesses, and the full test suite.
        </p>

        {/* Sub Navigation Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 border-t border-white/[0.06]">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeSubTab === tab.id
                  ? 'bg-purple-600/30 text-white border border-purple-400/50 shadow-sm'
                  : 'bg-white/[0.02] hover:bg-white/[0.06] text-gray-400 hover:text-gray-200 border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Render Selected Sub-Section */}
      <div className="w-full">
        {activeSubTab === 'eval_results' && (
          <EvaluationResultsSection summary={summary} />
        )}

        {activeSubTab === 'live_theater' && <LiveTheaterSection />}

        {activeSubTab === 'showdown' && <ShowdownSection />}

        {activeSubTab === 'training' && <TrainingMonitorSection />}

        {activeSubTab === 'breakit' && <BreakItLabSection />}

        {activeSubTab === 'audit' && <AuditExplorerSection />}

        {activeSubTab === 'policy' && <PolicyBudgetSection />}

        {activeSubTab === 'simulator' && <SimulatorSection />}

        {activeSubTab === 'tests' && <TestsHealthSection />}

        {activeSubTab === 'architecture' && (
          <HowItWorksSection
            presenterMode={presenterMode}
            onTogglePresenterMode={() => {}}
            onAdvanceSection={() => {}}
          />
        )}

        {activeSubTab === 'overview' && (
          <OverviewSection
            summary={summary}
            systemInfo={systemInfo}
            onNavigate={() => {}}
          />
        )}
      </div>
    </div>
  );
};
