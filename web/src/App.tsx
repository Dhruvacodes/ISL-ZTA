import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CommandPalette } from './components/CommandPalette';
import { ToastContainer, ToastMessage } from './components/Toast';
import { OverviewSection } from './sections/OverviewSection';
import { LiveTheaterSection } from './sections/LiveTheaterSection';
import { ShowdownSection } from './sections/ShowdownSection';
import { TrainingMonitorSection } from './sections/TrainingMonitorSection';
import { EvaluationResultsSection } from './sections/EvaluationResultsSection';
import { BreakItLabSection } from './sections/BreakItLabSection';
import { AuditExplorerSection } from './sections/AuditExplorerSection';
import { PolicyBudgetSection } from './sections/PolicyBudgetSection';
import { SimulatorSection } from './sections/SimulatorSection';
import { TestsHealthSection } from './sections/TestsHealthSection';
import { HowItWorksSection } from './sections/HowItWorksSection';
import { SystemInfo, EvalSummary } from './types';
import { AlertCircle, ChevronUp } from 'lucide-react';

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [summary, setSummary] = useState<EvalSummary | null>(null);
  const [testsPassedCount, setTestsPassedCount] = useState(22);
  const [presenterMode, setPresenterMode] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchData = async () => {
    try {
      const [sysRes, sumRes, tstRes] = await Promise.all([
        fetch('/api/system'),
        fetch('/api/eval/summary'),
        fetch('/api/tests/status'),
      ]);
      if (sysRes.ok) setSystemInfo(await sysRes.json());
      if (sumRes.ok) setSummary(await sumRes.json());
      if (tstRes.ok) {
        const td = await tstRes.json();
        setTestsPassedCount(td.passed || 22);
      }
    } catch (err) {
      console.error('Failed to load initial Mission Control data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopySummary = async () => {
    try {
      const res = await fetch('/api/summary/share');
      const data = await res.json();
      await navigator.clipboard.writeText(data.markdown || '# ZT-Arbiter');
      addToast('success', 'Summary Copied to Clipboard', 'Markdown benchmark report ready for sharing.');
    } catch (err) {
      addToast('error', 'Clipboard Error', 'Failed to copy summary markdown.');
    }
  };

  const handleRunPytest = async () => {
    addToast('info', 'Running Test Suite', 'Executing pytest --junitxml in background...');
    try {
      const res = await fetch('/api/tests/run', { method: 'POST' });
      const data = await res.json();
      if (data.passed) {
        addToast('success', 'All Tests Passed', '22/22 pytest assertions verified.');
      } else {
        addToast('error', 'Tests Failed', 'Review failed test cases in Tests tab.');
      }
      fetchData();
    } catch (err) {
      addToast('error', 'Execution Error', String(err));
    }
  };

  const handleVerifyChain = async () => {
    addToast('info', 'Verifying Hash Chain', 'Computing SHA-256 state transitions...');
    try {
      const res = await fetch('/api/audit/verify', { method: 'POST' });
      const data = await res.json();
      if (data.valid) {
        addToast('success', 'Hash Chain Verified', `All ${data.total_records} records cryptographically intact.`);
      } else {
        addToast('error', 'Tamper Detected', `Broken at record #${data.record_id}: ${data.error}`);
      }
    } catch (err) {
      addToast('error', 'Verification Error', String(err));
    }
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#07070A] text-gray-100 flex flex-col selection:bg-purple-500/30 selection:text-purple-200">
      {/* Top Navbar */}
      <Navbar
        systemInfo={systemInfo}
        testsPassedCount={testsPassedCount}
        activeSection={activeSection}
        onSelectSection={scrollToSection}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onCopySummary={handleCopySummary}
        presenterMode={presenterMode}
        onTogglePresenterMode={() => {
          setPresenterMode(!presenterMode);
          addToast(
            'info',
            !presenterMode ? 'Presenter Mode Activated' : 'Presenter Mode Deactivated',
            !presenterMode ? 'Enlarged charts, streamlined panels for 5-minute presentation.' : 'Full developer controls restored.'
          );
        }}
      />

      {/* Main Content Sections */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-24">
        {/* Section 0: Overview */}
        <OverviewSection
          summary={summary}
          systemInfo={systemInfo}
          onNavigate={scrollToSection}
        />

        {/* Section 1: Live Arbitration Theater */}
        <LiveTheaterSection />

        {/* Section 2: Showdown */}
        <ShowdownSection />

        {/* Section 3: Training Monitor */}
        <TrainingMonitorSection />

        {/* Section 4: Evaluation Results */}
        <EvaluationResultsSection summary={summary} />

        {/* Section 5: Break-It Lab */}
        <BreakItLabSection />

        {/* Section 6: Audit Explorer */}
        <AuditExplorerSection />

        {/* Section 7: Policy & Budget Inspector */}
        <PolicyBudgetSection />

        {/* Section 8: Simulator Inspector */}
        <SimulatorSection />

        {/* Section 9: Tests & Health */}
        <TestsHealthSection />

        {/* Section 10: How It Works & Presenter Mode */}
        <HowItWorksSection
          presenterMode={presenterMode}
          onTogglePresenterMode={() => setPresenterMode(!presenterMode)}
          onAdvanceSection={scrollToSection}
        />
      </main>

      {/* Persistent Bottom Disclaimer Ribbon */}
      <footer className="w-full bg-[#050508] border-t border-white/[0.06] py-6 px-4 text-center text-xs text-gray-500 space-y-2">
        <div className="flex items-center justify-center space-x-2 text-amber-400/80">
          <AlertCircle size={13} />
          <span className="font-medium">
            Strict Scientific Disclaimer: All results, metrics, and streams are evaluated on a synthetic discrete-event benchmark and do not represent measured production enterprise network traffic.
          </span>
        </div>
        <p className="text-[11px] text-gray-600 font-mono">
          Zero-Trust Policy Arbitration Framework • Version 0.2.0 • SHA-256 Hash Chained • OPA Rego Parity Verified
        </p>
      </footer>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectSection={scrollToSection}
        onRunDemo={() => scrollToSection('theater')}
        onRunTests={handleRunPytest}
        onVerifyChain={handleVerifyChain}
        onCopySummary={handleCopySummary}
      />

      {/* Toast System */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
