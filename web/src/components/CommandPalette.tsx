import React, { useState, useEffect } from 'react';
import { Search, X, Activity, Play, ShieldAlert, Cpu, Database, CheckCircle, FileText, BookOpen, Layers, Sparkles } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSection: (sectionId: string) => void;
  onRunDemo?: () => void;
  onRunTests?: () => void;
  onVerifyChain?: () => void;
  onCopySummary?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectSection,
  onRunDemo,
  onRunTests,
  onVerifyChain,
  onCopySummary,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    { id: 'story', title: 'The Story: 10-Chapter Guided Walkthrough', icon: Sparkles, cat: 'Main View' },
    { id: 'tryit', title: 'Try It: Interactive Simulation Sandbox', icon: Play, cat: 'Main View' },
    { id: 'results', title: 'Results: Three Big Questions & Scorecard', icon: FileText, cat: 'Main View' },
    { id: 'underthehood', title: 'Under the Hood: Deep Technical Inspector', icon: Cpu, cat: 'Main View' },
    { id: 'glossary', title: 'Glossary: Plain English & Technical Terms', icon: BookOpen, cat: 'Main View' },
    { id: 'action-demo', title: 'Action: Run Live Simulation Sandbox', icon: Play, cat: 'Action', action: onRunDemo },
    { id: 'action-copy', title: 'Action: Copy Shareable Markdown Summary', icon: FileText, cat: 'Action', action: onCopySummary },
  ];

  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.cat.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-xl rounded-2xl bg-[#0F0F17] border border-white/15 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input bar */}
        <div className="flex items-center px-4 py-3 border-b border-white/10 space-x-3">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Type a section or command (e.g. story, results, tryit)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-500 focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* List of items */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500">
              No matching sections or actions found.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else {
                      onSelectSection(item.id);
                    }
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/10 text-left transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-lg bg-white/5 text-purple-300 group-hover:text-purple-200 group-hover:bg-purple-500/20 transition-colors">
                      <Icon size={16} />
                    </div>
                    <span className="text-xs font-medium text-gray-200 group-hover:text-white">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400 group-hover:text-gray-300">
                    {item.cat}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500 font-mono">
          <span>Navigation: Press ESC to exit</span>
          <span>Tip: Press T for Plain/Technical toggle</span>
        </div>
      </div>
    </div>
  );
};
