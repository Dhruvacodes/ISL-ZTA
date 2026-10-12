import React, { useState, useEffect, useRef } from 'react';
import { FramedMockupCard } from '../components/FramedMockupCard';
import { GemDiamond, GemShield, GemRisk, GemBudget, GemPolicy, GemTerminal } from '../components/Gems';
import { Play, Pause, RotateCcw, AlertTriangle, ShieldCheck, ChevronRight, Info, Zap } from 'lucide-react';
import { DecisionEvent } from '../types';

export const LiveTheaterSection: React.FC = () => {
  const [scenario, setScenario] = useState('adaptive_pacing');
  const [controller, setController] = useState('Full Framework');
  const [speed, setSpeed] = useState(1.0);
  const [seed, setSeed] = useState(42);
  const [isPlaying, setIsPlaying] = useState(false);
  const [events, setEvents] = useState<DecisionEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<DecisionEvent | null>(null);
  const [selectedDrawerEvent, setSelectedDrawerEvent] = useState<DecisionEvent | null>(null);
  const [flashVeto, setFlashVeto] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  const startStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setEvents([]);
    setIsPlaying(true);

    const url = `/api/stream/${scenario}?controller=${encodeURIComponent(controller)}&speed=${speed}&seed=${seed}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const data: DecisionEvent = jsonParseSafe(e.data);
        if (data) {
          setCurrentEvent(data);
          setEvents((prev) => [data, ...prev.slice(0, 39)]);

          if (data.overridden) {
            setFlashVeto(true);
            setTimeout(() => setFlashVeto(false), 800);
          }
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    es.onerror = () => {
      es.close();
      setIsPlaying(false);
    };
  };

  const stopStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const resetStream = () => {
    stopStream();
    setEvents([]);
    setCurrentEvent(null);
    setSelectedDrawerEvent(null);
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  const jsonParseSafe = (str: string) => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  // Color mapping
  const actionColors: Record<string, { bg: string; text: string; border: string }> = {
    ALLOW: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
    MFA: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30' },
    RESTRICT: { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30' },
    DENY: { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30' },
    QUARANTINE: { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
  };

  const actionNames = ['ALLOW', 'MFA', 'RESTRICT', 'DENY', 'QUARANTINE'];

  return (
    <section id="theater" className="relative space-y-6 py-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <GemDiamond size={16} glow={true} />
            <span className="text-[11px] uppercase font-semibold tracking-wider text-purple-400">
              SECTION 1: PRODUCTION TELEMETRY
            </span>
          </div>
          <h2 className="text-3xl font-light tracking-tight text-white mt-1">
            Live Arbitration Theater
          </h2>
          <p className="text-xs text-gray-400 max-w-xl mt-1">
            Interactive real-time execution of continuous authorization decisions. Inspect the policy mask,
            authoritative budget balance, and dynamic runtime shield vetoes in flight.
          </p>
        </div>

        {/* Controls Pill Bar */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
          {/* Scenario select */}
          <select
            value={scenario}
            onChange={(e) => {
              setScenario(e.target.value);
              if (isPlaying) resetStream();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs text-gray-200 outline-none focus:border-indigo-400"
          >
            <option value="adaptive_pacing">Adaptive Pacing Attack</option>
            <option value="burst_access">Burst Exfiltration</option>
            <option value="gradual_exfiltration">Gradual Low-and-Slow</option>
            <option value="session_resets">Session Reset Evasion</option>
            <option value="credential_abuse">Compromised Credentials</option>
            <option value="repeated_auth_failures">Repeated Auth Failures</option>
            <option value="benign">Benign Routine Work</option>
          </select>

          {/* Controller select */}
          <select
            value={controller}
            onChange={(e) => {
              setController(e.target.value);
              if (isPlaying) resetStream();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs text-gray-200 outline-none focus:border-indigo-400"
          >
            <option value="Full Framework">Full Framework</option>
            <option value="Deterministic Budget">Deterministic Budget</option>
            <option value="Risk Threshold">Risk Threshold</option>
            <option value="Static RBAC">Static RBAC</option>
            <option value="Unmasked PPO">Unmasked PPO</option>
          </select>

          {/* Speed */}
          <select
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="px-2 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs text-gray-300 outline-none"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1.0x</option>
            <option value="2">2.0x</option>
            <option value="4">4.0x</option>
          </select>

          {/* Play/Pause */}
          <button
            onClick={isPlaying ? stopStream : startStream}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
            }`}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} className="fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Start Feed'}</span>
          </button>

          <button
            onClick={resetStream}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Reset Stream"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Main Two-Column Alternating Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Live Mockup Card with Stream and Flash Veto */}
        <div className="lg:col-span-8">
          <FramedMockupCard
            caption="Live Decision Stream"
            subcaption={isPlaying ? "Streaming live synthetic events" : "Paused"}
            className={flashVeto ? "animate-flash-veto" : ""}
          >
            {/* Live Feed Upper Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-black/40 border border-white/5 mb-4">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-mono">Current Target</span>
                <div className="text-sm font-medium text-white truncate">
                  {currentEvent ? `${currentEvent.principal} → ${currentEvent.resource}` : '—'}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase font-mono">Budget Balance</span>
                <div className="text-sm font-semibold text-amber-400">
                  {currentEvent ? `${currentEvent.budget.toFixed(1)} / 100.0` : '100.0 / 100.0'}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase font-mono">Risk Index rho_t</span>
                <div className="text-sm font-semibold text-rose-400">
                  {currentEvent ? currentEvent.risk_score.toFixed(3) : '0.000'}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase font-mono">Shield Verdict</span>
                <div className="text-sm font-semibold">
                  {currentEvent ? (
                    currentEvent.overridden ? (
                      <span className="text-rose-400 flex items-center space-x-1">
                        <AlertTriangle size={12} />
                        <span>Vetoed ({currentEvent.executed})</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center space-x-1">
                        <ShieldCheck size={12} />
                        <span>Allowed ({currentEvent.executed})</span>
                      </span>
                    )
                  ) : (
                    'Ready'
                  )}
                </div>
              </div>
            </div>

            {/* Shield Veto Reason Banner */}
            {currentEvent?.overridden && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between animate-pulse">
                <div className="flex items-center space-x-2">
                  <AlertTriangle size={16} className="text-rose-400" />
                  <span className="font-medium">
                    Shield Override: Proposed <strong>{currentEvent.proposed}</strong>, forced <strong>{currentEvent.executed}</strong>
                  </span>
                </div>
                <span className="font-mono text-[11px] text-rose-300">
                  {currentEvent.veto_reason || 'Feasibility constraint triggered'}
                </span>
              </div>
            )}

            {/* Streaming Request Table */}
            <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-[11px] font-mono">
                    <th className="py-2 px-2">Time</th>
                    <th className="py-2 px-2">Principal</th>
                    <th className="py-2 px-2">Resource</th>
                    <th className="py-2 px-2">Vol</th>
                    <th className="py-2 px-2">Risk</th>
                    <th className="py-2 px-2">Proposed</th>
                    <th className="py-2 px-2">Executed</th>
                    <th className="py-2 px-2">Budget</th>
                    <th className="py-2 px-2">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500 text-xs">
                        Feed paused. Click "Start Feed" to stream live continuous arbitration decisions.
                      </td>
                    </tr>
                  ) : (
                    events.map((ev, idx) => {
                      const color = actionColors[ev.executed] || actionColors.DENY;
                      return (
                        <tr
                          key={idx}
                          onClick={() => setSelectedDrawerEvent(ev)}
                          className={`hover:bg-white/[0.04] cursor-pointer transition-colors ${
                            ev.overridden ? 'bg-rose-500/5' : ''
                          }`}
                        >
                          <td className="py-2 px-2 font-mono text-gray-400">{ev.timestamp_hr}h</td>
                          <td className="py-2 px-2 font-medium text-gray-200">{ev.principal}</td>
                          <td className="py-2 px-2 text-gray-300">{ev.resource}</td>
                          <td className="py-2 px-2 font-mono text-gray-400">{ev.volume.toFixed(2)}</td>
                          <td className="py-2 px-2 font-mono text-rose-300">{ev.risk_score.toFixed(2)}</td>
                          <td className="py-2 px-2 text-gray-400 font-mono text-[11px]">{ev.proposed}</td>
                          <td className="py-2 px-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono border ${color.bg} ${color.text} ${color.border}`}
                            >
                              {ev.executed}
                            </span>
                          </td>
                          <td className="py-2 px-2 font-mono text-amber-300">{ev.budget.toFixed(1)}</td>
                          <td className="py-2 px-2 text-indigo-400 hover:text-indigo-300">
                            <ChevronRight size={14} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Cumulative Attack Volume Line vs Target Line */}
            {currentEvent && (
              <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-2">
                <div className="flex items-center space-x-3">
                  <span>
                    Cumulative Leaked: <strong className="text-rose-400 font-mono">{currentEvent.cum_malicious_volume.toFixed(3)}</strong> units
                  </span>
                  <span>•</span>
                  <span>
                    Attacker Target: <strong className="text-gray-300 font-mono">{currentEvent.cum_target_volume.toFixed(3)}</strong> units
                  </span>
                </div>
                <div className="text-[11px] text-gray-500">
                  Containment efficiency: {(100 - (currentEvent.cum_malicious_volume / (currentEvent.cum_target_volume || 1)) * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </FramedMockupCard>
        </div>

        {/* Right column: "Why this decision" Equation Drawer and Mask Status */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Info size={16} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Decision Logic Inspector</h3>
              </div>
              <span className="text-[10px] font-mono text-gray-400">
                {selectedDrawerEvent ? 'Selected Event' : 'Latest Event'}
              </span>
            </div>

            {(() => {
              const ev = selectedDrawerEvent || currentEvent;
              if (!ev) {
                return (
                  <div className="py-12 text-center text-xs text-gray-500">
                    Select an event row from the feed to inspect the Equation 4 terms and policy constraints.
                  </div>
                );
              }

              const terms = ev.charge_terms || {
                kappa: 1500,
                v: ev.volume,
                sigma: 0.5,
                rho_pow_p: ev.risk_score ** 2,
                total_charge: ev.charge,
              };

              return (
                <div className="space-y-4 text-xs">
                  {/* Action Mask Chips */}
                  <div>
                    <span className="text-[11px] font-medium text-gray-400 uppercase font-mono block mb-1.5">
                      Policy Mask m_t (Eq. 8)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {actionNames.map((act, i) => {
                        const isMaskAllowed = ev.mask && ev.mask[i] === 1;
                        const isFeasible = ev.feasible_set && ev.feasible_set.includes(i);

                        return (
                          <span
                            key={act}
                            className={`px-2 py-0.5 rounded-lg font-mono text-[10px] border flex items-center space-x-1 ${
                              isFeasible
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : isMaskAllowed
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-white/5 text-gray-500 border-white/5 line-through'
                            }`}
                          >
                            <span>{act}</span>
                            {isFeasible ? <span>✓</span> : <span>✕</span>}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Equation 4 Charge Breakdown */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-indigo-300 font-semibold">
                      <span>Eq. (4) Charge Breakdown</span>
                      <span className="font-mono text-amber-300">C_t = {terms.total_charge.toFixed(4)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-gray-300">
                      <div>Scaling factor kappa: <span className="text-white">{terms.kappa}</span></div>
                      <div>Action volume v: <span className="text-white">{terms.v.toFixed(3)}</span></div>
                      <div>Resource sigma: <span className="text-white">{terms.sigma.toFixed(2)}</span></div>
                      <div>Risk term rho^p: <span className="text-white">{terms.rho_pow_p.toFixed(4)}</span></div>
                    </div>

                    <div className="text-[10px] text-gray-500 pt-1 border-t border-white/5 font-mono">
                      C_t = {terms.kappa} × {terms.v.toFixed(3)} × {terms.sigma.toFixed(2)} × {terms.rho_pow_p.toFixed(4)}
                    </div>
                  </div>

                  {/* Triggered Policy Rules */}
                  <div>
                    <span className="text-[11px] font-medium text-gray-400 uppercase font-mono block mb-1">
                      Triggered Rego Constraints
                    </span>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      {ev.triggered_rules && ev.triggered_rules.length > 0 ? (
                        ev.triggered_rules.map((rule, idx) => (
                          <div key={idx} className="font-mono text-[11px] text-purple-300 flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            <span>{rule}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-500 font-mono text-[11px]">Role standard access permitted</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </section>
  );
};
