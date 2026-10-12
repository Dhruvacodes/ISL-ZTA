import React, { useState, useEffect } from 'react';
import { FramedMockupCard } from '../components/FramedMockupCard';
import { GemDiamond, GemShield, GemRisk } from '../components/Gems';
import { Play, CheckCircle2, XCircle, AlertTriangle, ShieldAlert, RefreshCw, Clock } from 'lucide-react';
import { BreakItScenario } from '../types';

export const BreakItLabSection: React.FC = () => {
  const [scenarios, setScenarios] = useState<BreakItScenario[]>([]);
  const [results, setResults] = useState<Record<string, any>>({});
  const [runningId, setRunningId] = useState<string | null>(null);

  const fetchScenarios = async () => {
    try {
      const res = await fetch('/api/breakit/list');
      const data = await res.json();
      setScenarios(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const runTest = async (id: string) => {
    setRunningId(id);
    try {
      const res = await fetch(`/api/breakit/run/${id}`, { method: 'POST' });
      const data = await res.json();
      setResults((prev) => ({ ...prev, [id]: data }));
    } catch (err) {
      console.error(`Failed to run test ${id}:`, err);
    } finally {
      setRunningId(null);
    }
  };

  const runAll = async () => {
    for (const sc of scenarios) {
      await runTest(sc.id);
    }
  };

  const passedCount = Object.values(results).filter((r) => r.passed).length;
  const totalScenarios = scenarios.length || 10;

  return (
    <section id="breakit" className="relative space-y-6 py-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <GemRisk size={16} glow={true} />
            <span className="text-[11px] uppercase font-semibold tracking-wider text-rose-400">
              SECTION 5: ADVERSARIAL RESILIENCE LAB
            </span>
          </div>
          <h2 className="text-3xl font-light tracking-tight text-white mt-1">
            Break-It Safety Invariant Test Lab
          </h2>
          <p className="text-xs text-gray-400 max-w-xl mt-1">
            Live adversarial failure injection suite testing fail-closed safety, atomic budget locks, token nonces,
            and cryptographic hash chain integrity under extreme faults.
          </p>
        </div>

        {/* Coverage Counter and Run All Button */}
        <div className="flex items-center space-x-3">
          <div className="px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs text-gray-300 font-mono">
            Safety Invariants: <strong className="text-emerald-400">{passedCount}/{totalScenarios}</strong> Handled
          </div>

          <button
            onClick={runAll}
            disabled={runningId !== null}
            className="px-4 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <ShieldAlert size={14} />
            <span>Run All 10 Tests</span>
          </button>
        </div>
      </div>

      {/* Grid of 10 Failure Injections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((sc) => {
          const res = results[sc.id];
          const isRunning = runningId === sc.id;

          return (
            <div
              key={sc.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                res
                  ? res.passed
                    ? 'bg-emerald-500/[0.03] border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                    : 'bg-rose-500/[0.05] border-rose-500/40 shadow-lg shadow-rose-500/10'
                  : 'bg-black/60 border-white/[0.08] hover:border-white/15'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white tracking-tight">{sc.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{sc.desc}</p>
                  </div>

                  {res ? (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border shrink-0 ${
                        res.passed
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {res.result}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10 text-[10px] font-mono shrink-0">
                      IDLE
                    </span>
                  )}
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] space-y-1">
                  <div className="text-gray-400 font-mono text-[10px] uppercase">Expected Guarantee:</div>
                  <div className="text-gray-300 font-normal">{sc.expected}</div>
                </div>

                {/* Outcome message and timeline if executed */}
                {res && (
                  <div className="mt-3 space-y-2">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs text-emerald-300 font-mono">
                      {res.message}
                    </div>

                    {res.timeline && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] text-gray-400 uppercase font-mono block">Incident Timeline:</span>
                        {res.timeline.map((step: any, idx: number) => (
                          <div key={idx} className="flex items-start space-x-2 text-[11px] text-gray-400 font-mono">
                            <span className="text-purple-400 shrink-0">{step.step}</span>
                            <span className="text-gray-300">{step.event}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-mono text-gray-500">
                  {res?.latency_ms ? `Ran in ${res.latency_ms} ms` : 'Fail-Closed Verified'}
                </span>

                <button
                  onClick={() => runTest(sc.id)}
                  disabled={isRunning}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  <Play size={12} className={isRunning ? 'animate-spin' : ''} />
                  <span>{isRunning ? 'Running...' : 'Execute Test'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
