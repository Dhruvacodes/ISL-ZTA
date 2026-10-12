import React from 'react';
import { Quote, AlertCircle, Sparkles } from 'lucide-react';

interface ClaimCardProps {
  findingText?: string;
  source?: string;
  className?: string;
}

export const ClaimCard: React.FC<ClaimCardProps> = ({
  findingText,
  source = "results/summary.json (Quick Profile, 5 seeds)",
  className = "",
}) => {
  const defaultText =
    "On adaptive pacing and low-and-slow evasions, static perimeter RBAC permitted 66.7% - 100% of target exfiltration volume; our stateful budget-aware arbitration framework bounded exfiltration to 13.3% while maintaining 3.25 useful work units with zero policy violations.";

  return (
    <div className={`relative p-6 rounded-2xl bg-gradient-to-b from-[#101018] to-[#0A0A10] border border-white/10 shadow-2xl overflow-hidden ${className}`}>
      {/* Background glow subtle violet radial */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Quote className="text-purple-400 rotate-180" size={20} />
          <span className="text-[11px] font-bold uppercase tracking-widest text-purple-400">
            HEADLINE EMPIRICAL FINDING
          </span>
        </div>
        <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-[10px] font-medium text-amber-300">
          <AlertCircle size={10} />
          <span>Synthetic simulator results, not measured enterprise traffic</span>
        </div>
      </div>

      <p className="text-base md:text-lg font-light text-gray-200 leading-relaxed tracking-tight pl-2 border-l-2 border-purple-500/60">
        "{findingText || defaultText}"
      </p>

      {/* Decorative gradient hairline accent */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <Sparkles size={12} className="text-indigo-400" />
          <span className="font-mono text-[11px]">Traced to: {source}</span>
        </div>
        <div className="h-[2px] w-24 bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 rounded-full" />
      </div>
    </div>
  );
};
