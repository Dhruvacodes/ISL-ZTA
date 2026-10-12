import React, { useState, useEffect, useRef } from 'react';
import {
  SCENARIOS,
  CONTROLLERS,
  LanguageMode,
  VOCABULARY,
} from '../copy';
import {
  GemDiamond,
  GemShield,
  GemLock,
  GemZap,
  GemRisk,
  GemBudget,
} from '../components/Gems';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  HelpCircle,
  Database,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface DecisionEvent {
  step: number;
  principal: string;
  resource: string;
  requested_volume: number;
  allowed_volume: number;
  risk_score: number;
  budget_before: number;
  budget_after: number;
  proposed_action: string;
  executed_action: string;
  overridden: boolean;
  veto_reason?: string;
  cum_allowed_volume: number;
  target_volume: number;
  is_attack: boolean;
}

interface TryItSectionProps {
  languageMode: LanguageMode;
  onNavigateTab: (tabId: string) => void;
}

export const TryItSection: React.FC<TryItSectionProps> = ({
  languageMode,
  onNavigateTab,
}) => {
  const [scenarioId, setScenarioId] = useState<string>('gradual_exfiltration');
  const [controllerId, setControllerId] = useState<string>('Full Framework');
  const [speed, setSpeed] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [seed, setSeed] = useState<number>(42);
  const [events, setEvents] = useState<DecisionEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<DecisionEvent | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [showHelpOverlay, setShowHelpOverlay] = useState<boolean>(false);

  // Auto-pause callout modals
  const [activeCallout, setActiveCallout] = useState<{
    title: string;
    description: string;
    type: 'overrule' | 'depleted' | 'quarantine';
  } | null>(null);
  const hasSeenOverrule = useRef(false);
  const hasSeenDepleted = useRef(false);
  const hasSeenQuarantine = useRef(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  const startStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setIsPlaying(true);

    const url = `/api/stream/${scenarioId}?controller=${encodeURIComponent(
      controllerId
    )}&speed=${speed}&seed=${seed}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const data: DecisionEvent = JSON.parse(e.data);
        if (data) {
          setCurrentEvent(data);
          setEvents((prev) => [data, ...prev.slice(0, 49)]);

          // Check notable events for auto-pause
          if (data.overridden && !hasSeenOverrule.current) {
            hasSeenOverrule.current = true;
            setIsPlaying(false);
            es.close();
            setActiveCallout({
              title: 'Safety Check Overruled the AI',
              description: `The AI proposed '${data.proposed_action}', but the safety check stepped in and forced '${data.executed_action}'. Reason: ${
                data.veto_reason || 'Exceeds allowable policy or exposure allowance'
              }. Notice how the AI can never grant itself more access than rules permit.`,
              type: 'overrule',
            });
            return;
          }

          if (data.budget_after <= 0.05 && data.budget_before > 0.05 && !hasSeenDepleted.current) {
            hasSeenDepleted.current = true;
            setIsPlaying(false);
            es.close();
            setActiveCallout({
              title: 'Daily Exposure Allowance Exhausted',
              description:
                'The account has reached its daily data limit! Notice how subsequent sensitive requests are held or blocked until the allowance refills slowly over time.',
              type: 'depleted',
            });
            return;
          }

          if (data.executed_action === 'QUARANTINE' && !hasSeenQuarantine.current) {
            hasSeenQuarantine.current = true;
            setIsPlaying(false);
            es.close();
            setActiveCallout({
              title: 'Account Locked and Security Alerted',
              description:
                'Suspicion reached critical levels. The system locked the account and dispatched an urgent alert to the security operations center.',
              type: 'quarantine',
            });
            return;
          }
        }
      } catch (err) {
        console.error('SSE JSON parse error:', err);
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

  const resetSimulation = () => {
    stopStream();
    setEvents([]);
    setCurrentEvent(null);
    hasSeenOverrule.current = false;
    hasSeenDepleted.current = false;
    hasSeenQuarantine.current = false;
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  const formatDecisionSentence = (ev: DecisionEvent) => {
    const timeStr = `Step #${ev.step}`;
    const volMB = Math.round((ev.requested_volume || 0.04) * 1000);
    const resName = ev.resource ? ev.resource.replace('_', ' ') : 'customer database';
    const riskVal = (ev.risk_score || 0).toFixed(2);
    const riskLevel = ev.risk_score > 0.6 ? 'HIGH' : ev.risk_score > 0.35 ? 'ELEVATED' : 'LOW';

    if (ev.overridden) {
      return `${timeStr}: Account requested ${volMB} MB from ${resName}. Suspicion was ${riskLevel} (${riskVal}). The AI suggested '${ev.proposed_action}', but the safety check overruled it (${ev.veto_reason || 'exceeds remaining allowance'}). Final result: ${ev.executed_action}.`;
    }

    return `${timeStr}: Account requested ${volMB} MB from ${resName}. Suspicion was ${riskLevel} (${riskVal}). Final result: ${ev.executed_action}.`;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'ALLOW':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'MFA':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'RESTRICT':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'DENY':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'QUARANTINE':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
    }
  };

  const currentScenario = SCENARIOS[scenarioId] || SCENARIOS['gradual_exfiltration'];
  const currentCtrl = CONTROLLERS[controllerId] || CONTROLLERS['Full Framework'];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6" id="tryit-container">
      {/* Top Banner and Help Overlay Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08]">
        <div>
          <h2 className="text-xl sm:text-2xl font-light text-white tracking-tight">
            {languageMode === 'plain' ? 'Interactive Simulation Sandbox' : 'Live Arbitration Simulator'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            {languageMode === 'plain'
              ? 'Choose an attack scenario and watch in real time how each security system responds.'
              : 'Execute discrete-event benchmark streams with dynamic parameter tuning and inspection.'}
          </p>
        </div>

        <button
          onClick={() => setShowHelpOverlay(true)}
          className="px-4 py-2 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 border border-purple-500/30 text-xs font-medium flex items-center space-x-1.5 transition-colors"
        >
          <HelpCircle size={14} />
          <span>What am I looking at?</span>
        </button>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-5 p-5 rounded-2xl bg-[#0B0B10] border border-white/[0.08]">
          {/* Scenario Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-purple-300 uppercase tracking-wider block">
              1. Choose Scenario
            </label>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {Object.values(SCENARIOS).map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => {
                    setScenarioId(sc.id);
                    resetSimulation();
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all ${
                    scenarioId === sc.id
                      ? 'bg-purple-600/30 border border-purple-400/50 text-white font-medium shadow-sm'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-gray-400'
                  }`}
                >
                  <div className="font-medium text-gray-200">
                    {languageMode === 'plain' ? sc.plainName : sc.technicalName}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">
                    {sc.plainDescription}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Controller Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-purple-300 uppercase tracking-wider block">
              2. Choose Security System
            </label>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {Object.values(CONTROLLERS).map((ctrl) => (
                <button
                  key={ctrl.id}
                  onClick={() => {
                    setControllerId(ctrl.id);
                    resetSimulation();
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all ${
                    controllerId === ctrl.id
                      ? 'bg-indigo-600/30 border border-indigo-400/50 text-white font-medium shadow-sm'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-200">
                      {languageMode === 'plain' ? ctrl.plainName : ctrl.technicalName}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-gray-400">
                      {ctrl.badge}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                    {ctrl.plainDescription}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Speed & Stream Buttons */}
          <div className="space-y-3 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Simulation Speed:</span>
              <span className="font-mono text-purple-300">{speed}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.5"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full accent-purple-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={isPlaying ? stopStream : startStream}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                  isPlaying
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20 hover:from-purple-400 hover:to-indigo-500'
                }`}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlaying ? 'Pause' : 'Start Simulation'}</span>
              </button>

              <button
                onClick={resetSimulation}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs transition-colors"
                title="Reset Simulation"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Center & Right Column: The Stage + Sentences Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Top Live Gauges: The Vault Leak Meter & Allowance Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* The Vault Leak Meter */}
            <div className="p-4 rounded-2xl bg-[#0B0B10] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database size={16} className="text-indigo-400" />
                  <span className="text-xs font-medium text-white">The Vault Leak Meter</span>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400">
                  {currentEvent
                    ? `${(currentEvent.cum_allowed_volume || 0).toFixed(2)} / ${(
                        currentEvent.target_volume || 0.48
                      ).toFixed(2)} GB`
                    : '0.00 / 0.48 GB'}
                </span>
              </div>
              <div className="w-full h-3 bg-black/50 rounded-full border border-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-red-600 rounded-full transition-all duration-300"
                  style={{
                    width: currentEvent
                      ? `${Math.min(
                          100,
                          ((currentEvent.cum_allowed_volume || 0) /
                            (currentEvent.target_volume || 0.48)) *
                            100
                        )}%`
                      : '0%',
                  }}
                />
              </div>
              <span className="text-[11px] text-gray-400 block">
                Target: {currentScenario.attackerGoal}
              </span>
            </div>

            {/* Daily Exposure Allowance Bar */}
            <div className="p-4 rounded-2xl bg-[#0B0B10] border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GemBudget size={16} glow={true} />
                  <span className="text-xs font-medium text-white">Daily Exposure Allowance</span>
                </div>
                <span className="text-xs font-mono font-bold text-purple-300">
                  {currentEvent ? `${(currentEvent.budget_after || 0).toFixed(1)} / 100.0` : '100.0 / 100.0'}
                </span>
              </div>
              <div className="w-full h-3 bg-black/50 rounded-full border border-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{
                    width: currentEvent ? `${Math.min(100, currentEvent.budget_after || 0)}%` : '100%',
                  }}
                />
              </div>
              <span className="text-[11px] text-gray-400 block">
                Refills slowly (+1.0 / min) up to maximum
              </span>
            </div>
          </div>

          {/* Sentence-Style Decision Feed */}
          <div className="p-5 rounded-2xl bg-[#0B0B10] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-medium text-white">
                  Decision Stream (Plain English Sentences)
                </h3>
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {events.length} decisions recorded
              </span>
            </div>

            {/* Event rows */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {events.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500 space-y-2">
                  <p>Simulation paused. Click "Start Simulation" to stream real live decisions.</p>
                  <p className="text-[11px] text-gray-600 font-mono">
                    All numbers, suspicion levels, and allowance balances are generated live.
                  </p>
                </div>
              ) : (
                events.map((ev, idx) => (
                  <div
                    key={`${ev.step}-${idx}`}
                    className={`p-3 rounded-xl border text-xs transition-all space-y-2 ${
                      ev.overridden
                        ? 'bg-rose-500/10 border-rose-500/40 shadow-sm shadow-rose-500/10'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-gray-200 leading-relaxed flex-1">
                        {formatDecisionSentence(ev)}
                      </p>
                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionColor(
                            ev.executed_action
                          )}`}
                        >
                          {ev.executed_action}
                        </span>
                        <button
                          onClick={() =>
                            setExpandedRow(expandedRow === ev.step ? null : ev.step)
                          }
                          className="p-1 rounded text-gray-400 hover:text-white"
                          title="Show technical equation breakdown"
                        >
                          {expandedRow === ev.step ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Technical Details */}
                    {expandedRow === ev.step && (
                      <div className="pt-2 border-t border-white/10 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 text-gray-400 font-mono">
                        <div>
                          <span>Risk Score (rho): </span>
                          <strong className="text-white">{(ev.risk_score || 0).toFixed(3)}</strong>
                        </div>
                        <div>
                          <span>Proposal (a_tilde): </span>
                          <strong className="text-white">{ev.proposed_action}</strong>
                        </div>
                        <div>
                          <span>Budget Delta: </span>
                          <strong className="text-white">
                            -{(ev.budget_before - ev.budget_after).toFixed(2)}
                          </strong>
                        </div>
                        <div>
                          <span>Veto Status: </span>
                          <strong className={ev.overridden ? 'text-rose-400' : 'text-emerald-400'}>
                            {ev.overridden ? 'SHIELD_OVERRULE' : 'PASSED'}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Auto-pause notable event callout modal */}
      {activeCallout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#0F0F16] border border-purple-500/40 shadow-2xl space-y-4 text-left">
            <div className="flex items-center space-x-2 text-amber-400">
              <ShieldAlert size={22} className="text-amber-400" />
              <h4 className="text-base font-semibold text-white">{activeCallout.title}</h4>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {activeCallout.description}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setActiveCallout(null);
                  startStream();
                }}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
              >
                Continue Simulation →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "What am I looking at?" Help Overlay */}
      {showHelpOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-xl w-full p-6 rounded-3xl bg-[#0B0B10] border border-white/20 shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-light text-white flex items-center space-x-2">
                <HelpCircle size={18} className="text-purple-400" />
                <span>Guide: What are you looking at?</span>
              </h3>
              <button
                onClick={() => setShowHelpOverlay(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <strong className="text-purple-300 block">1. The Controls (Left Column)</strong>
                <p>Pick what kind of attack or workday to run, and which security controller to evaluate against it.</p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <strong className="text-rose-400 block">2. The Vault Leak Meter (Top Center)</strong>
                <p>Tracks how much sensitive customer data has successfully left the database. In traditional systems, this climbs to 100%.</p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <strong className="text-indigo-400 block">3. Daily Exposure Allowance (Top Right)</strong>
                <p>Acts like a daily spending limit for sensitive data. Each request drains it; suspicious requests cost more; it refills slowly over time.</p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <strong className="text-emerald-300 block">4. Decision Stream in Sentences (Bottom)</strong>
                <p>Every single request is written out as a clear sentence showing what the user asked for, suspicion level, and whether the safety check stepped in.</p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpOverlay(false)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
            >
              Got it, back to the sandbox
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
