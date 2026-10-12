import React, { useState, useEffect } from 'react';
import { Search, X, Activity, Play, ShieldAlert, Cpu, Database, CheckCircle, FileText, BookOpen, Layers } from 'lucide-react';

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
        else onClose(); // parent handles toggle
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
    { id: 'overview', title: '0. Overview (Mission Control)', icon: Activity, cat: 'Section' },
    { id: 'theater', title: '1. Live Arbitration Theater', icon: Play, cat: 'Section' },
    { id: 'showdown', title: '2. Synchronized Showdown Replay', icon: Layers, cat: 'Section' },
    { id: 'training', title: '3. Training Monitor (PPO Curves)', icon: Cpu, cat: 'Section' },
    { id: 'results', title: '4. Evaluation Results & Ablations', icon: FileText, cat: 'Section' },
    { id: 'breakit', title: '5. Break-It Lab (10 Failure Injections)', icon: ShieldAlert, cat: 'Section' },
    { id: 'audit', title: '6. Audit Explorer & Hash Chain', icon: Database, cat: 'Section' },
    { id: 'policy', title: '7. Policy & Budget Inspector', icon: BookOpen, cat: 'Section' },
    { id: 'simulator', title: '8. Simulator Inspector', icon: Activity, cat: 'Section' },
    { id: 'tests', title: '9. Tests, Health & Acceptance Checklist', icon: CheckCircle, cat: 'Section' },
    { id: 'architecture', title: '10. Architecture & Presenter Script', icon: Layers, cat: 'Section' },
    { id: 'action-demo', title: 'Action: Run Live Demo Stream', icon: Play, cat: 'Action', action: onRunDemo },
    { id: 'action-tests', title: 'Action: Run Pytest Suite', icon: CheckCircle, cat: 'Action', action: onRunTests },
    { id: 'action-verify', title: 'Action: Verify Audit Hash Chain', icon: Database, cat: 'Action', action: onVerifyChain },
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
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sections or actions (Ctrl+K)..."
            className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Results list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">No matching sections or actions</div>
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
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-indigo-500/20 text-gray-300 group-hover:text-indigo-300 transition-colors">
                      <Icon size={16} />
                    </div>
                    <span className="text-sm text-gray-200 group-hover:text-white font-medium">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/5 text-gray-400 group-hover:text-gray-300">
                    {item.cat}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
          <span>Navigate with mouse or Esc to close</span>
          <span className="font-mono">ZT-Arbiter v0.2.0</span>
        </div>
      </div>
    </div>
  );
};
