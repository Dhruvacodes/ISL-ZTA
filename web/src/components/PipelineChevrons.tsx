import React, { useState } from 'react';
import {
  GemDiamond,
  GemShield,
  GemRisk,
  GemBudget,
  GemPolicy,
  GemAudit,
  GemCpu,
  GemTerminal,
} from './Gems';
import { ArrowRight, RotateCcw } from 'lucide-react';

interface PipelineChevronsProps {
  activeStage?: string;
  latencies?: Record<string, number>;
}

export const PipelineChevrons: React.FC<PipelineChevronsProps> = ({
  activeStage = '',
  latencies = {},
}) => {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const stages = [
    { id: 'request', label: '1. Request', gem: GemDiamond, desc: 'Incoming access opportunity', eq: 'Eq. (1)' },
    { id: 'context', label: '2. Context', gem: GemCpu, desc: 'Sliding window historical state & device posture', eq: 'Eq. (2)' },
    { id: 'risk', label: '3. Risk', gem: GemRisk, desc: 'Ordinal anomaly evaluation rho_t', eq: 'Eq. (3)' },
    { id: 'budget', label: '4. Budget', gem: GemBudget, desc: 'Authoritative balance B_t reservation', eq: 'Eq. (5)' },
    { id: 'mask', label: '5. Policy Mask', gem: GemPolicy, desc: 'Rego / pure-Python authorization filter m_t', eq: 'Eq. (8)' },
    { id: 'arbitrate', label: '6. Arbitrate (RL)', gem: GemTerminal, desc: 'Learned policy proposes candidate a_t', eq: 'Eq. (9)' },
    { id: 'shield', label: '7. Shield', gem: GemShield, desc: 'Authoritative feasibility set verification F_t', eq: 'Eq. (10)-(11)' },
    { id: 'enforce', label: '8. Enforce', gem: GemShield, desc: 'Signed token minting & PEP verification', eq: 'Sec. 3.4' },
    { id: 'audit', label: '9. Audit', gem: GemAudit, desc: 'Append-only SHA-256 write-ahead chain', eq: 'Sec. 3.5' },
  ];

  return (
    <div className="w-full flex flex-col space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
            Authoritative Arbitration Pipeline
          </span>
          <span className="text-gray-500">• End-to-end continuous zero-trust enforcement</span>
        </div>
        <div className="flex items-center space-x-1 text-gray-500 text-[11px]">
          <RotateCcw size={12} className="text-purple-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Delayed RL Feedback Loop (Eq. 12)</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-1.5 p-1.5 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md">
        {stages.map((st, idx) => {
          const GemComp = st.gem;
          const isActive = activeStage.toLowerCase() === st.id;
          const lat = latencies[st.id] !== undefined ? latencies[st.id] : 0.08 + (idx * 0.03);

          return (
            <div
              key={st.id}
              onMouseEnter={() => setHoveredStage(st.id)}
              onMouseLeave={() => setHoveredStage(null)}
              className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 cursor-pointer text-center group ${
                isActive
                  ? 'bg-gradient-to-b from-indigo-500/25 to-purple-500/20 border border-indigo-400/60 shadow-lg shadow-indigo-500/20 scale-[1.02]'
                  : 'bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06]'
              }`}
            >
              {/* Subtle top indicator dot */}
              <div
                className={`w-1.5 h-1.5 rounded-full mb-1 transition-colors duration-200 ${
                  isActive ? 'bg-indigo-400 animate-ping' : 'bg-white/20 group-hover:bg-indigo-400/60'
                }`}
              />

              <div className="mb-1">
                <GemComp size={18} glow={isActive} />
              </div>

              <span className="text-[11px] font-medium text-gray-200 tracking-tight leading-tight line-clamp-1">
                {st.label.replace(/^\d+\.\s*/, '')}
              </span>

              <span className="text-[10px] font-mono text-gray-400 mt-0.5">
                {lat.toFixed(2)} ms
              </span>

              {/* Hover equation tooltip */}
              {hoveredStage === st.id && (
                <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 z-30 w-48 p-2 rounded-lg bg-gray-950/95 border border-indigo-500/30 text-[10px] text-gray-200 shadow-2xl pointer-events-none backdrop-blur-md">
                  <div className="font-semibold text-indigo-300">{st.label} ({st.eq})</div>
                  <div className="text-gray-400 text-[9px] mt-0.5">{st.desc}</div>
                  <div className="text-emerald-400 font-mono mt-0.5">Latency: {lat.toFixed(3)} ms</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
