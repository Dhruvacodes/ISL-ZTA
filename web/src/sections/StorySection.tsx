import React, { useState, useEffect } from 'react';
import {
  STORY_CHAPTERS,
  StoryChapter,
  LanguageMode,
  VOCABULARY,
} from '../copy';
import {
  GemDiamond,
  GemShield,
  GemLock,
  GemZap,
  GemScale,
  GemAudit,
} from '../components/Gems';
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  ShieldAlert,
  Database,
  User,
  Skull,
  Lock,
  Sparkles,
} from 'lucide-react';

interface StorySectionProps {
  languageMode: LanguageMode;
  initialChapter?: number;
  presenterMode?: boolean;
  showSpeakerNotes?: boolean;
  onNavigateTab: (tabId: string) => void;
}

export const StorySection: React.FC<StorySectionProps> = ({
  languageMode,
  initialChapter = 1,
  presenterMode = false,
  showSpeakerNotes = false,
  onNavigateTab,
}) => {
  const [currentChapterId, setCurrentChapterId] = useState<number>(initialChapter);
  const [tamperedBlock, setTamperedBlock] = useState<boolean>(false);
  const [shieldOverruled, setShieldOverruled] = useState<boolean>(false);
  const [allowanceDrained, setAllowanceDrained] = useState<number>(100);
  const [animatingStep, setAnimatingStep] = useState<number>(0);

  useEffect(() => {
    setCurrentChapterId(initialChapter);
  }, [initialChapter]);

  const currentChapter = STORY_CHAPTERS.find((c) => c.id === currentChapterId) || STORY_CHAPTERS[0];

  const handleNext = () => {
    if (currentChapterId < STORY_CHAPTERS.length) {
      setCurrentChapterId((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentChapterId > 1) {
      setCurrentChapterId((prev) => prev - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentChapterId]);

  // Periodic visual animation trigger
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatingStep((prev) => (prev + 1) % 4);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8" id="story-container">
      {/* Top progress bar and chapter dots */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <div className="flex items-center space-x-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-purple-400">
            Chapter {currentChapter.chapterNumber} of {STORY_CHAPTERS.length}
          </span>
          <span className="text-gray-500">•</span>
          <span className="text-xs text-gray-300 font-medium">
            {languageMode === 'plain' ? currentChapter.plainTitle : currentChapter.technicalTitle}
          </span>
        </div>

        {/* Progress dots */}
        <div className="flex items-center space-x-1.5">
          {STORY_CHAPTERS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setCurrentChapterId(ch.id)}
              className={`h-2 rounded-full transition-all duration-200 ${
                ch.id === currentChapterId
                  ? 'w-7 bg-purple-500'
                  : ch.id < currentChapterId
                  ? 'w-2 bg-indigo-500/50 hover:bg-indigo-400'
                  : 'w-2 bg-white/10 hover:bg-white/20'
              }`}
              title={`Chapter ${ch.id}: ${ch.title}`}
            />
          ))}
        </div>

        {/* Skip to Try It */}
        <button
          onClick={() => onNavigateTab('tryit')}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Skip to Interactive Sandbox →
        </button>
      </div>

      {/* Main Chapter Card */}
      <div className="relative p-6 sm:p-10 rounded-3xl bg-[#0B0B10] border border-white/[0.1] shadow-2xl overflow-hidden space-y-8">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header and prompt */}
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono">
            <span>Chapter {currentChapter.chapterNumber}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white tracking-tight">
            {languageMode === 'plain' ? currentChapter.plainTitle : currentChapter.technicalTitle}
          </h2>

          <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-3xl">
            {currentChapter.summary}
          </p>

          <div className="flex items-center space-x-2 p-3 rounded-xl bg-purple-500/5 border border-purple-500/15 text-xs text-purple-200">
            <Sparkles size={14} className="text-purple-400 flex-shrink-0" />
            <span><strong>Watch for:</strong> {currentChapter.prompt}</span>
          </div>
        </div>

        {/* Interactive Visual Stage */}
        <div className="relative min-h-[300px] p-6 rounded-2xl bg-black/40 border border-white/[0.08] flex flex-col justify-center items-center">
          {/* Chapter 1: Normal Flow */}
          {currentChapter.visualType === 'normal_flow' && (
            <div className="w-full max-w-2xl flex flex-col items-center space-y-6">
              <div className="flex items-center justify-between w-full">
                {/* Priya */}
                <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/10 w-36">
                  <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <User size={24} />
                  </div>
                  <span className="text-sm font-medium text-white">Priya</span>
                  <span className="text-[11px] text-gray-400 text-center">Finance Analyst</span>
                </div>

                {/* Animated Arrow */}
                <div className="flex-1 flex flex-col items-center px-4">
                  <span className="text-xs text-emerald-400 font-mono mb-1 animate-pulse">
                    Quarterly Report (40 MB)
                  </span>
                  <div className="w-full h-1 bg-gradient-to-r from-emerald-500/40 via-emerald-400 to-indigo-500/40 rounded-full relative">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50 transition-all duration-1000"
                      style={{ left: `${(animatingStep / 3) * 85 + 5}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-400 mt-2">
                    Action: <strong className="text-emerald-300">Let through (ALLOW)</strong>
                  </span>
                </div>

                {/* The Vault */}
                <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/10 w-36">
                  <div className="p-3 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <Database size={24} />
                  </div>
                  <span className="text-sm font-medium text-white">The Vault</span>
                  <span className="text-[11px] text-gray-400 text-center">Customer Records</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 text-center w-full">
                ✓ Regular legitimate work flows unimpeded. Most people just want to do their job.
              </div>
            </div>
          )}

          {/* Chapter 2: The Problem */}
          {currentChapter.visualType === 'the_problem' && (
            <div className="w-full max-w-2xl flex flex-col items-center space-y-6">
              <div className="flex items-center justify-between w-full">
                {/* The Intruder */}
                <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 w-36">
                  <div className="p-3 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <Skull size={24} />
                  </div>
                  <span className="text-sm font-medium text-rose-300">The Intruder</span>
                  <span className="text-[11px] text-rose-400/80 text-center">Stolen Password</span>
                </div>

                {/* Traditional Static RBAC */}
                <div className="flex-1 flex flex-col items-center px-4 space-y-2">
                  <span className="text-xs text-rose-400 font-mono">
                    Slow Download #{(animatingStep % 4) + 1} (40 MB)
                  </span>
                  <div className="w-full h-1 bg-rose-500/40 rounded-full relative">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-rose-400 rounded-full shadow-lg shadow-rose-400/50 transition-all duration-1000"
                      style={{ left: `${(animatingStep / 3) * 85 + 5}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-gray-300 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    Traditional Check: <em>Priya has permission? Yes.</em> → <strong className="text-emerald-400">Allowed</strong>
                  </div>
                </div>

                {/* The Vault */}
                <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/10 w-36">
                  <div className="p-3 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <Database size={24} />
                  </div>
                  <span className="text-sm font-medium text-white">The Vault</span>
                  <span className="text-[11px] text-rose-400 font-medium">
                    Stolen: 0.48 / 0.48 GB
                  </span>
                </div>
              </div>

              {/* Stolen Data Leak Meter */}
              <div className="w-full space-y-1.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="flex justify-between text-xs text-rose-200">
                  <span>Data Copied Out (Leak Meter):</span>
                  <span className="font-mono font-bold">100% Leaked (0.48 GB)</span>
                </div>
                <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-rose-500/30">
                  <div className="h-full bg-gradient-to-r from-rose-500 to-red-600 rounded-full w-full animate-pulse" />
                </div>
                <p className="text-[11px] text-rose-300 text-center font-medium pt-1">
                  ⚠ Every single request was individually approved, yet the entire confidential archive walked out the door.
                </p>
              </div>
            </div>
          )}

          {/* Chapter 3: Allowance Bar */}
          {currentChapter.visualType === 'allowance_bar' && (
            <div className="w-full max-w-xl space-y-6">
              <div className="space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 font-medium">Priya's Daily Exposure Allowance:</span>
                  <span className="font-mono text-purple-300 font-semibold">{allowanceDrained.toFixed(1)} / 100.0 Tokens</span>
                </div>
                <div className="w-full h-4 bg-black/50 rounded-full overflow-hidden border border-white/10 relative">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      allowanceDrained > 50
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                        : allowanceDrained > 20
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                        : 'bg-gradient-to-r from-rose-500 to-red-500'
                    }`}
                    style={{ width: `${allowanceDrained}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Recharging at steady rate (+1.0 / min)</span>
                  <span>Costs grow steeply with high suspicion</span>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setAllowanceDrained((prev) => Math.max(0, prev - 25))}
                  className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-xs border border-purple-400/30 transition-colors"
                >
                  Simulate Sensitive Request (-25 tokens)
                </button>
                <button
                  onClick={() => setAllowanceDrained(100)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs border border-white/10 transition-colors"
                >
                  Refill Allowance (Reset)
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                As the intruder pulls files, the daily allowance drains. When the allowance hits zero, further bulk downloads are strictly blocked.
              </p>
            </div>
          )}

          {/* Chapter 4: AI Choices */}
          {currentChapter.visualType === 'ai_choices' && (
            <div className="w-full max-w-2xl space-y-4">
              <span className="text-xs text-gray-400 text-center block">
                The 5 Graduated Responses:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                  <span className="text-emerald-400 font-bold text-xs block">Let through</span>
                  <span className="text-[10px] text-gray-400">Normal low-risk tasks</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1 ring-2 ring-amber-400">
                  <span className="text-amber-400 font-bold text-xs block">Ask for Identity</span>
                  <span className="text-[10px] text-amber-200">2-Factor Security</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center space-y-1">
                  <span className="text-blue-400 font-bold text-xs block">Limited</span>
                  <span className="text-[10px] text-gray-400">Small preview only</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center space-y-1">
                  <span className="text-rose-400 font-bold text-xs block">Block</span>
                  <span className="text-[10px] text-gray-400">Reject request</span>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center space-y-1">
                  <span className="text-purple-400 font-bold text-xs block">Lock Account</span>
                  <span className="text-[10px] text-gray-400">Freeze & alert team</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-gray-300 text-center">
                Instead of a binary lock-out, the AI selects <strong>Ask for Identity (MFA)</strong> or <strong>Limited</strong> when suspicion is mild, preserving user productivity.
              </div>
            </div>
          )}

          {/* Chapter 5: Safety Shield */}
          {currentChapter.visualType === 'safety_shield' && (
            <div className="w-full max-w-xl space-y-6">
              <div
                className={`p-5 rounded-2xl border transition-all duration-300 ${
                  shieldOverruled
                    ? 'bg-rose-500/15 border-rose-500 shadow-lg shadow-rose-500/20 ring-2 ring-rose-400 animate-pulse'
                    : 'bg-white/[0.03] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <GemShield size={20} glow={true} />
                    <span className="text-sm font-semibold text-white">Mathematical Safety Check</span>
                  </div>
                  {shieldOverruled && (
                    <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-bold text-xs animate-bounce">
                      OVERRULED
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">AI Suggested:</span>
                    <span className="font-mono text-emerald-400">Let through (ALLOW)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">Remaining Daily Allowance:</span>
                    <span className="font-mono text-rose-400">0.0 Tokens (Exhausted)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-400">Final Executed Decision:</span>
                    <span className="font-mono font-bold text-rose-400">
                      {shieldOverruled ? 'Block (DENY) [Enforced by Safety Check]' : 'Evaluating...'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShieldOverruled(true)}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs border border-rose-400/30 font-medium transition-colors"
                >
                  Trigger Safety Overrule Demo
                </button>
                <button
                  onClick={() => setShieldOverruled(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs border border-white/10 transition-colors"
                >
                  Reset
                </button>
              </div>

              <p className="text-xs text-rose-300/90 text-center font-medium">
                The AI can only choose options the company rules permit. It can never grant itself more access.
              </p>
            </div>
          )}

          {/* Chapter 6: Head to Head */}
          {currentChapter.visualType === 'head_to_head' && (
            <div className="w-full max-w-2xl space-y-4">
              <span className="text-xs text-gray-400 text-center block">
                Stealthy Low-and-Slow Attack: Total Data Stolen (Target: 0.48 GB)
              </span>

              <div className="space-y-3">
                {/* Traditional RBAC */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Traditional Access Control (RBAC):</span>
                    <span className="font-mono text-rose-400 font-bold">0.48 GB (100% Leaked)</span>
                  </div>
                  <div className="w-full h-3 bg-black/40 rounded-full border border-white/10 overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full w-full" />
                  </div>
                </div>

                {/* Simple Suspicion Filter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Simple Suspicion Filter:</span>
                    <span className="font-mono text-rose-400 font-bold">0.48 GB (100% Leaked)</span>
                  </div>
                  <div className="w-full h-3 bg-black/40 rounded-full border border-white/10 overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full w-full" />
                  </div>
                </div>

                {/* Fixed Allowance Rule */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">Fixed Allowance Rule (Deterministic):</span>
                    <span className="font-mono text-amber-400 font-bold">0.48 GB (100% Leaked)</span>
                  </div>
                  <div className="w-full h-3 bg-black/40 rounded-full border border-white/10 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full w-full" />
                  </div>
                </div>

                {/* Our System */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-purple-300">★ Our System (AI + Safety Check):</span>
                    <span className="font-mono text-emerald-400 font-bold">0.12 GB (Only 25% Leaked)</span>
                  </div>
                  <div className="w-full h-4 bg-black/40 rounded-full border border-purple-400/40 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-purple-500 rounded-full w-1/4 shadow-lg shadow-emerald-400/30" />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 text-center font-medium">
                Our framework cut data theft by 75% compared to static security, while guaranteeing 0 company rule violations.
              </div>
            </div>
          )}

          {/* Chapter 7: User Impact */}
          {currentChapter.visualType === 'user_impact' && (
            <div className="w-full max-w-xl space-y-4">
              <span className="text-xs text-gray-400 text-center block">
                Legitimate Work Completed During Workday:
              </span>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center space-y-1">
                  <span className="text-2xl font-light text-white font-mono">3.25</span>
                  <span className="text-xs text-gray-400 block">Traditional Security</span>
                  <span className="text-[11px] text-emerald-400">100% work completed</span>
                </div>
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center space-y-1">
                  <span className="text-2xl font-light text-purple-300 font-mono">3.25</span>
                  <span className="text-xs text-gray-300 block">Our System</span>
                  <span className="text-[11px] text-emerald-400">100% work completed (0 false blocks)</span>
                </div>
              </div>

              <p className="text-xs text-gray-300 text-center leading-relaxed">
                Employees experienced only a modest 6.7% two-factor identity verification rate on high-risk databases, with zero false rejections.
              </p>
            </div>
          )}

          {/* Chapter 8: Audit Chain */}
          {currentChapter.visualType === 'audit_chain' && (
            <div className="w-full max-w-2xl space-y-6">
              <div className="flex items-center justify-center space-x-2 overflow-x-auto py-2">
                {[101, 102, 103, 104, 105].map((id) => {
                  const isTampered = tamperedBlock && id >= 103;
                  return (
                    <div key={id} className="flex items-center space-x-1.5">
                      <div
                        className={`p-3 rounded-xl border text-center transition-all duration-300 ${
                          isTampered
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500 animate-pulse'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        <span className="text-[10px] font-mono block">Record #{id}</span>
                        <span className="text-xs font-bold block">
                          {isTampered && id === 103 ? 'TAMPERED' : isTampered ? 'BROKEN' : 'VALID'}
                        </span>
                        <span className="text-[9px] font-mono text-gray-400">SHA-256</span>
                      </div>
                      {id < 105 && (
                        <span className={`text-xs ${isTampered ? 'text-rose-500' : 'text-emerald-500'}`}>
                          →
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setTamperedBlock(true)}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs border border-rose-400/30 font-medium transition-colors"
                >
                  Alter One Entry (Simulate Hack)
                </button>
                <button
                  onClick={() => setTamperedBlock(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs border border-white/10 transition-colors"
                >
                  Restore Original (Verify Chain)
                </button>
              </div>

              <p className="text-xs text-gray-300 text-center font-medium">
                {tamperedBlock
                  ? '⚠ Tampering detected! Cryptographic verification pinpointed record #103.'
                  : 'Every decision is permanently recorded in a cryptographic chain. Any modification is instantly exposed.'}
              </p>
            </div>
          )}

          {/* Chapter 9: Where It Struggles */}
          {currentChapter.visualType === 'limitations' && (
            <div className="w-full max-w-2xl space-y-4">
              <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider text-center block">
                Honest Limitations: What the Experiment Proved and Did Not Prove
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-left">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <span className="font-semibold text-white block">1. Sudden Burst Downloads</span>
                  <p className="text-gray-400 leading-relaxed">
                    On massive downloads in under 5 seconds, a fixed mathematical rule clamped down immediately, matching the AI without needing learning.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <span className="font-semibold text-white block">2. Ultra-Slow Attackers</span>
                  <p className="text-gray-400 leading-relaxed">
                    If an attacker waits hours between downloads, staying below the allowance refill rate, data can still slowly leak over several months.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <span className="font-semibold text-white block">3. Multi-Identity Attacks</span>
                  <p className="text-gray-400 leading-relaxed">
                    Allowances track individual accounts. A syndicate using 50 stolen accounts requires cross-principal clustering.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <span className="font-semibold text-white block">4. Synthetic Data</span>
                  <p className="text-gray-400 leading-relaxed">
                    All numbers are evaluated on a controlled discrete-event simulator, not real production corporate network traffic.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chapter 10: Takeaway */}
          {currentChapter.visualType === 'takeaway' && (
            <div className="w-full max-w-xl text-center space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-b from-purple-500/10 to-indigo-500/5 border border-purple-500/20 space-y-3">
                <h3 className="text-lg font-medium text-white">Three Main Takeaways:</h3>
                <ul className="text-xs text-gray-300 text-left space-y-2 leading-relaxed">
                  <li>• <strong>Exposure allowances work:</strong> Tracking cumulative access stops low-and-slow theft that static security misses.</li>
                  <li>• <strong>AI reduces friction:</strong> Flexible graduated responses protect security without grinding daily work to a halt.</li>
                  <li>• <strong>Safety checks are non-negotiable:</strong> The safety check guaranteed zero policy violations across all 29,064 decisions.</li>
                </ul>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => onNavigateTab('tryit')}
                  className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-lg shadow-purple-500/25 transition-colors"
                >
                  Try the Simulator Yourself →
                </button>
                <button
                  onClick={() => onNavigateTab('results')}
                  className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-200 font-medium text-xs border border-white/10 transition-colors"
                >
                  See Full Human Results →
                </button>
                <button
                  onClick={() => onNavigateTab('underthehood')}
                  className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-purple-300 font-medium text-xs border border-purple-400/20 transition-colors"
                >
                  Inspect Under the Hood →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
          <button
            onClick={handleBack}
            disabled={currentChapterId === 1}
            className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-colors ${
              currentChapterId === 1
                ? 'opacity-30 cursor-not-allowed text-gray-600'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10'
            }`}
          >
            <ArrowLeft size={14} />
            <span>Previous</span>
          </button>

          <span className="text-xs text-gray-500 font-mono">
            Use Left / Right arrow keys or Space to advance
          </span>

          <button
            onClick={handleNext}
            disabled={currentChapterId === STORY_CHAPTERS.length}
            className={`px-5 py-2 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-colors ${
              currentChapterId === STORY_CHAPTERS.length
                ? 'opacity-30 cursor-not-allowed text-gray-600'
                : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-md shadow-purple-500/20'
            }`}
          >
            <span>Next</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Presenter Speaker Notes Overlay (if enabled) */}
        {showSpeakerNotes && (
          <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 space-y-1">
            <span className="font-semibold text-purple-300 uppercase tracking-wider block">
              🎤 Speaker Notes (Talking Points for Presenter):
            </span>
            <p className="italic">{currentChapter.speakerNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
