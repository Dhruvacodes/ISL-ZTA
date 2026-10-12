import React, { useState } from 'react';
import { VOCABULARY, TermDefinition, LanguageMode } from '../copy';
import { GemDiamond, GemShield, GemLock, GemZap } from '../components/Gems';
import { Search, BookOpen, Code, HelpCircle } from 'lucide-react';

interface GlossarySectionProps {
  languageMode: LanguageMode;
}

export const GlossarySection: React.FC<GlossarySectionProps> = ({
  languageMode,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const terms = Object.entries(VOCABULARY).filter(([key, item]) => {
    const q = searchTerm.toLowerCase();
    return (
      item.plain.toLowerCase().includes(q) ||
      item.technical.toLowerCase().includes(q) ||
      item.plainDefinition.toLowerCase().includes(q) ||
      item.technicalDefinition.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8" id="glossary-container">
      {/* Header banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0B10] border border-white/[0.08] space-y-4">
        <div className="flex items-center space-x-2 text-purple-400">
          <BookOpen size={20} />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Zero-Trust Access Control Dictionary
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
          Plain English & Technical Glossary
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 max-w-2xl leading-relaxed">
          Translate between plain language used by executive leadership and the formal mathematical terminology used in security engineering papers.
        </p>

        {/* Search input */}
        <div className="relative max-w-md pt-2">
          <Search size={15} className="absolute left-3.5 top-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search terms, equations, or concepts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Persistent Mini-Legend Box */}
      <div className="p-5 rounded-2xl bg-[#0B0B10] border border-white/[0.08] space-y-3">
        <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
          Action Legend & Color Semantics:
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-0.5">
            <span className="font-bold block">Let through (ALLOW)</span>
            <span className="text-[11px] text-gray-400">Green • Normal safe traffic</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-0.5">
            <span className="font-bold block">Ask Identity (MFA)</span>
            <span className="text-[11px] text-gray-400">Amber • 2-Factor challenge</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 space-y-0.5">
            <span className="font-bold block">Limited (RESTRICT)</span>
            <span className="text-[11px] text-gray-400">Blue • Rate limited or preview</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-0.5">
            <span className="font-bold block">Block (DENY)</span>
            <span className="text-[11px] text-gray-400">Red • Immediate rejection</span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 space-y-0.5">
            <span className="font-bold block">Lock (QUARANTINE)</span>
            <span className="text-[11px] text-gray-400">Violet • Freeze session & alert</span>
          </div>
        </div>
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {terms.map(([key, item]) => (
          <div
            key={key}
            className="p-5 rounded-2xl bg-[#0B0B10] border border-white/[0.08] hover:border-purple-500/30 transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-2.5">
              <div>
                <span className="text-sm font-semibold text-white block">
                  {item.plain}
                </span>
                <span className="text-xs font-mono text-purple-400">
                  {item.technical}
                </span>
              </div>
              {item.equation && (
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px] text-indigo-300">
                  {item.equation}
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-gray-400 block">
                  Plain English Explanation:
                </span>
                <p className="text-gray-300 leading-relaxed mt-0.5">
                  {item.plainDefinition}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-gray-500 block">
                  Formal Technical Definition:
                </span>
                <p className="text-gray-400 leading-relaxed mt-0.5 font-mono text-[11px]">
                  {item.technicalDefinition}
                </p>
              </div>

              {item.codeRef && (
                <div className="pt-1 flex items-center space-x-1.5 text-[10px] text-gray-500 font-mono">
                  <Code size={11} />
                  <span>Implemented in {item.codeRef}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
