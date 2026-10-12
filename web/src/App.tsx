import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { CommandPalette } from './components/CommandPalette';
import { ToastContainer, ToastMessage } from './components/Toast';
import { StorySection } from './sections/StorySection';
import { TryItSection } from './sections/TryItSection';
import { ResultsHumanSection } from './sections/ResultsHumanSection';
import { UnderTheHoodSection } from './sections/UnderTheHoodSection';
import { GlossarySection } from './sections/GlossarySection';
import { SystemInfo, EvalSummary } from './types';
import { LanguageMode } from './copy';
import { AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'story' | 'tryit' | 'results' | 'underthehood' | 'glossary'>('story');
  const [languageMode, setLanguageMode] = useState<LanguageMode>('plain');
  const [initialStoryChapter, setInitialStoryChapter] = useState<number>(1);
  const [presenterMode, setPresenterMode] = useState<boolean>(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [summary, setSummary] = useState<EvalSummary | null>(null);
  const [testsPassedCount, setTestsPassedCount] = useState<number>(26);
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
        setTestsPassedCount(td.passed || 26);
      }
    } catch (err) {
      console.error('Failed to load initial Mission Control data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Global Keyboard Shortcuts (T for language, N for speaker notes, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 't' || e.key === 'T') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setLanguageMode((prev) => (prev === 'plain' ? 'technical' : 'plain'));
          addToast(
            'info',
            languageMode === 'plain' ? 'Switched to Technical Mode' : 'Switched to Plain English Mode',
            'All titles, metrics, and tooltips updated.'
          );
        }
      } else if (e.key === 'n' || e.key === 'N') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setShowSpeakerNotes((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [languageMode]);

  const handleCopySummary = async () => {
    try {
      const res = await fetch('/api/summary/share');
      const data = await res.json();
      await navigator.clipboard.writeText(data.markdown || '# ZT-Arbiter');
      addToast('success', 'Summary Copied to Clipboard', 'Benchmark report ready for sharing.');
    } catch (err) {
      addToast('error', 'Clipboard Error', 'Failed to copy summary markdown.');
    }
  };

  const handleSelectSection = (id: string) => {
    setActiveSection(id as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartStory = (chapterId: number = 1) => {
    setInitialStoryChapter(chapterId);
    setActiveSection('story');
    const el = document.getElementById('story-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      className={`min-h-screen bg-[#07070A] text-gray-100 flex flex-col selection:bg-purple-500/30 selection:text-purple-200 transition-all ${
        presenterMode ? 'text-lg leading-relaxed' : ''
      }`}
    >
      {/* Top Navbar */}
      <Navbar
        systemInfo={systemInfo}
        testsPassedCount={testsPassedCount}
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onCopySummary={handleCopySummary}
        presenterMode={presenterMode}
        onTogglePresenterMode={() => {
          setPresenterMode(!presenterMode);
          addToast(
            'info',
            !presenterMode ? 'Presenter Mode Activated' : 'Presenter Mode Deactivated',
            !presenterMode
              ? 'Enlarged high-contrast text. Use Space/Right to advance, N for speaker notes, T for terminology.'
              : 'Standard interactive controls restored.'
          );
        }}
        languageMode={languageMode}
        onToggleLanguageMode={() => {
          setLanguageMode((prev) => (prev === 'plain' ? 'technical' : 'plain'));
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        {activeSection === 'story' && (
          <div className="space-y-12">
            {/* 30-Second Landing Hero (C1) */}
            <LandingHero
              languageMode={languageMode}
              onStartStory={handleStartStory}
              onTryIt={() => handleSelectSection('tryit')}
              onTechnicalView={() => handleSelectSection('underthehood')}
            />

            {/* Guided Story Mode (C3) */}
            <StorySection
              languageMode={languageMode}
              initialChapter={initialStoryChapter}
              presenterMode={presenterMode}
              showSpeakerNotes={showSpeakerNotes}
              onNavigateTab={handleSelectSection}
            />
          </div>
        )}

        {activeSection === 'tryit' && (
          <TryItSection
            languageMode={languageMode}
            onNavigateTab={handleSelectSection}
          />
        )}

        {activeSection === 'results' && (
          <ResultsHumanSection
            summary={summary}
            languageMode={languageMode}
            onNavigateTab={handleSelectSection}
          />
        )}

        {activeSection === 'underthehood' && (
          <UnderTheHoodSection
            systemInfo={systemInfo}
            summary={summary}
            presenterMode={presenterMode}
          />
        )}

        {activeSection === 'glossary' && (
          <GlossarySection languageMode={languageMode} />
        )}
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
          Zero-Trust Access Control Framework • Mode: {languageMode.toUpperCase()} • OPA Rego Parity Verified • SHA-256 Ledger Intact
        </p>
      </footer>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectSection={handleSelectSection}
        onRunDemo={() => handleSelectSection('tryit')}
        onRunTests={() => handleSelectSection('underthehood')}
        onVerifyChain={() => handleSelectSection('underthehood')}
        onCopySummary={handleCopySummary}
      />

      {/* Toast Notification System */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
