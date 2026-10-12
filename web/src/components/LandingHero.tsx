import React from 'react';
import { GemDiamond, GemShield, GemLock, GemZap } from './Gems';
import { ArrowRight, Play, BookOpen, AlertCircle, HelpCircle } from 'lucide-react';
import { LanguageMode } from '../copy';

interface LandingHeroProps {
  languageMode: LanguageMode;
  onStartStory: (chapterId?: number) => void;
  onTryIt: () => void;
  onTechnicalView: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  languageMode,
  onStartStory,
  onTryIt,
  onTechnicalView,
}) => {
  return (
    <div className="relative py-8 md:py-14 overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center space-y-8">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
          <GemDiamond size={15} glow={true} />
          <span className="text-xs uppercase tracking-wider font-medium text-purple-300">
            {languageMode === 'plain' ? 'Zero-Trust Security Explainer' : 'Risk-Aware Policy Arbitration Framework'}
          </span>
          <span className="text-gray-500">•</span>
          <span className="text-xs text-gray-400">
            {languageMode === 'plain' ? '3-Minute Walkthrough' : 'Verifiable Safe RL for ZTA'}
          </span>
        </div>

        {/* Hero headline (56-72px) */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.08]">
            <span className="bg-gradient-to-r from-purple-300 via-indigo-200 to-sky-200 bg-clip-text text-transparent font-normal">
              {languageMode === 'plain'
                ? 'Stop slow data theft'
                : 'Bounded Learning.'}
            </span>
            <br />
            <span className="text-white font-extralight">
              {languageMode === 'plain'
                ? 'without locking everyone out.'
                : 'Verifiable Access.'}
            </span>
          </h1>

          {/* Sub-line */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-gray-400 font-normal leading-relaxed">
            {languageMode === 'plain'
              ? "Normal access control checks each request on its own, so a stolen account can quietly copy data a little at a time. Our system keeps a running 'exposure allowance' for each person, lets an AI choose the gentlest safe response, and a safety check guarantees it never breaks company rules."
              : 'Enterprise zero-trust architecture evaluated under stateful insider threat models. Combines constrained Markov decision processes with provable deterministic action masking and cryptographic runtime shielding.'}
          </p>
        </div>

        {/* CTA Button Row */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onStartStory(1)}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-medium text-sm shadow-xl shadow-purple-500/25 transition-all duration-200 flex items-center space-x-2 border border-purple-300/30 group"
          >
            <Play size={15} className="fill-white group-hover:scale-110 transition-transform" />
            <span>{languageMode === 'plain' ? 'Start Guided Story (3 min)' : 'Launch Guided Evaluation Walkthrough'}</span>
          </button>

          <button
            onClick={onTryIt}
            className="px-6 py-3 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-gray-200 font-medium text-sm transition-all duration-200 flex items-center space-x-2 border border-white/[0.12] hover:border-white/20"
          >
            <span>{languageMode === 'plain' ? 'Try the Simulator' : 'Interactive Sandbox'}</span>
            <ArrowRight size={15} />
          </button>

          <button
            onClick={onTechnicalView}
            className="px-4 py-3 rounded-full text-xs text-purple-300 hover:text-purple-200 hover:underline transition-colors flex items-center space-x-1.5"
          >
            <BookOpen size={14} />
            <span>{languageMode === 'plain' ? 'Read the technical view' : 'Jump to Technical Architecture'}</span>
          </button>
        </div>

        {/* Three Pillar Cards (C1) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 text-left">
          {/* Card 1: The Problem */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] hover:border-purple-500/30 transition-all duration-200 flex flex-col justify-between space-y-4 group">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-rose-400">
                <GemLock size={18} glow={true} />
                <span className="text-xs font-semibold tracking-wider uppercase">1. The Problem</span>
              </div>
              <h3 className="text-base font-medium text-white">
                {languageMode === 'plain' ? 'Stealthy slow data theft' : 'Unbounded RBAC Insider Loss'}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {languageMode === 'plain'
                  ? 'Normal security checks each request in isolation, so low-and-slow theft goes completely unnoticed.'
                  : 'Stateless permission checks permit authorized principals to iteratively exfiltrate high-value assets without triggering threshold alarms.'}
              </p>
            </div>
            <button
              onClick={() => onStartStory(2)}
              className="inline-flex items-center space-x-1.5 text-xs text-rose-300 hover:text-rose-200 font-medium group-hover:translate-x-0.5 transition-transform"
            >
              <span>{languageMode === 'plain' ? 'Show me the problem' : 'Inspect Threat Model'}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Card 2: The Idea */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] hover:border-purple-500/30 transition-all duration-200 flex flex-col justify-between space-y-4 group">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-indigo-400">
                <GemZap size={18} glow={true} />
                <span className="text-xs font-semibold tracking-wider uppercase">2. The Idea</span>
              </div>
              <h3 className="text-base font-medium text-white">
                {languageMode === 'plain' ? 'Exposure allowance + AI' : 'Stateful Budget & Safe RL'}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {languageMode === 'plain'
                  ? 'A daily exposure allowance drains as sensitive data leaves, while a safety check overrules the AI if rules would be broken.'
                  : 'Dynamic exposure budgeting (Eq. 4) coupled with action-masked PPO and a runtime supervisory shield guaranteeing safety invariance.'}
              </p>
            </div>
            <button
              onClick={() => onStartStory(3)}
              className="inline-flex items-center space-x-1.5 text-xs text-indigo-300 hover:text-indigo-200 font-medium group-hover:translate-x-0.5 transition-transform"
            >
              <span>{languageMode === 'plain' ? 'Show me the idea' : 'View Safety Architecture'}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Card 3: The Proof */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] hover:border-purple-500/30 transition-all duration-200 flex flex-col justify-between space-y-4 group">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400">
                <GemShield size={18} glow={true} />
                <span className="text-xs font-semibold tracking-wider uppercase">3. The Proof</span>
              </div>
              <h3 className="text-base font-medium text-white">
                {languageMode === 'plain' ? '75% less data stolen' : 'Zero Policy Violations'}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {languageMode === 'plain'
                  ? 'On stealthy attacks, static security leaked 100% of data while our framework cut theft to 25% with zero rule violations.'
                  : 'Empirical evaluation across 5 seeds: Attack Loss reduced from 0.48 to 0.12 GB with 0.00% PVR and identical legitimate utility.'}
              </p>
            </div>
            <button
              onClick={() => onStartStory(6)}
              className="inline-flex items-center space-x-1.5 text-xs text-emerald-300 hover:text-emerald-200 font-medium group-hover:translate-x-0.5 transition-transform"
            >
              <span>{languageMode === 'plain' ? 'Show me the proof' : 'Inspect Empirical Data'}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Synthetic benchmark disclaimer ribbon */}
        <div className="pt-2 flex items-center justify-center space-x-2 text-xs text-amber-400/80">
          <AlertCircle size={13} />
          <span>
            {languageMode === 'plain'
              ? 'Results are from a simulated company network benchmark, not live enterprise production data.'
              : 'Synthetic discrete-event simulator results under controlled validation and test splits.'}
          </span>
        </div>
      </div>
    </div>
  );
};
