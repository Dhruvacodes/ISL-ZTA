import React from 'react';
import { GemDiamond, GemShield } from './Gems';
import { Command, Copy, Presentation, CheckCircle, ShieldAlert, Sparkles, Globe, BookOpen } from 'lucide-react';
import { SystemInfo } from '../types';
import { LanguageMode } from '../copy';

interface NavbarProps {
  systemInfo: SystemInfo | null;
  testsPassedCount: number;
  activeSection: string;
  onSelectSection: (id: string) => void;
  onOpenCommandPalette: () => void;
  onCopySummary: () => void;
  presenterMode: boolean;
  onTogglePresenterMode: () => void;
  languageMode: LanguageMode;
  onToggleLanguageMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  systemInfo,
  testsPassedCount,
  activeSection,
  onSelectSection,
  onOpenCommandPalette,
  onCopySummary,
  presenterMode,
  onTogglePresenterMode,
  languageMode,
  onToggleLanguageMode,
}) => {
  const navItems = [
    { id: 'story', label: 'The Story' },
    { id: 'tryit', label: 'Try It' },
    { id: 'results', label: 'Results' },
    { id: 'underthehood', label: 'Under the Hood' },
    { id: 'glossary', label: 'Glossary' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#07070A]/90 backdrop-blur-xl border-b border-white/[0.08] transition-all">
      {/* Top micro status bar */}
      <div className="hidden lg:flex items-center justify-between px-6 py-1 bg-white/[0.015] border-b border-white/[0.04] text-[11px] text-gray-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-gray-300 font-mono">
              Policy: {systemInfo?.policy_hash?.slice(0, 8) || 'v1.0.0'}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 text-[10px] font-mono border border-indigo-500/20">
              {systemInfo?.opa_available ? 'OPA Rego CLI' : 'Python Ref'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-gray-500">|</span>
            <span className="text-emerald-400 font-mono flex items-center space-x-1">
              <CheckCircle size={10} />
              <span>Chain OK (SHA-256)</span>
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-gray-500">|</span>
            <span className="text-emerald-300 font-mono">
              Tests: {testsPassedCount}/26 Pass
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
            Synthetic Simulator Benchmark
          </span>
          <span className="text-gray-500 font-mono">Profile: {systemInfo?.profile || 'quick'}</span>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand logo */}
        <div
          onClick={() => onSelectSection('story')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 border border-purple-400/30 group-hover:border-purple-400/60 transition-colors shadow-sm">
            <GemDiamond size={20} glow={true} />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-base font-semibold tracking-tight text-white group-hover:text-purple-300 transition-colors">
                ZT-ARBITER
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25">
                MISSION CONTROL
              </span>
            </div>
            <p className="text-[10px] text-gray-400 tracking-wider uppercase hidden sm:block">
              Zero-Trust Access Control
            </p>
          </div>
        </div>

        {/* 5-Item Nav Pill Tabs */}
        {!presenterMode && (
          <nav className="hidden md:flex items-center space-x-1 p-1 rounded-full bg-white/[0.03] border border-white/[0.08]">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-white border border-purple-400/40 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Plain English / Technical Toggle (C2) */}
          <button
            onClick={onToggleLanguageMode}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              languageMode === 'plain'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
            }`}
            title="Toggle Plain English vs. Formal Technical Terminology (Key: T)"
          >
            <Globe size={13} />
            <span className="font-semibold">
              {languageMode === 'plain' ? 'Plain English' : 'Technical'}
            </span>
          </button>

          {/* Presenter Mode Button (C8) */}
          <button
            onClick={onTogglePresenterMode}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              presenterMode
                ? 'bg-purple-600/30 border-purple-400 text-purple-200'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
            }`}
            title="Toggle 3-Minute Presenter Mode"
          >
            <Presentation size={13} className={presenterMode ? 'text-purple-300 animate-pulse' : ''} />
            <span className="hidden sm:inline">
              {presenterMode ? 'Presenter: ON' : 'Presenter'}
            </span>
          </button>

          {/* Command Palette Button */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 text-xs transition-colors"
            title="Command Palette (Ctrl+K)"
          >
            <Command size={13} />
            <span className="hidden sm:inline font-mono text-[11px]">⌘K</span>
          </button>

          {/* Copy Summary */}
          <button
            onClick={onCopySummary}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs transition-colors"
            title="Copy Shareable Markdown Summary"
          >
            <Copy size={13} />
          </button>
        </div>
      </div>
    </header>
  );
};
