import React, { useState, useEffect } from 'react';
import { FramedMockupCard } from '../components/FramedMockupCard';
import { GemDiamond, GemShield, GemCpu, GemTerminal } from '../components/Gems';
import { Play, Square, RefreshCw, CheckCircle, AlertTriangle, Terminal, Cpu } from 'lucide-react';

export const TrainingMonitorSection: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeProfile, setActiveProfile] = useState('quick');

  const fetchTrainingData = async () => {
    try {
      const [sRes, mRes, lRes] = await Promise.all([
        fetch('/api/train/status'),
        fetch('/api/train/metrics'),
        fetch('/api/train/logs'),
      ]);
      setStatus(await sRes.json());
      setMetrics(await mRes.json());
      setLogs(await lRes.json());
    } catch (err) {
      console.error('Failed to load training monitor data:', err);
    }
  };

  useEffect(() => {
    fetchTrainingData();
    const interval = setInterval(fetchTrainingData, 4000);
    return () => clearInterval(interval);
  }, []);

  const launchTraining = async () => {
    setLoading(true);
    try {
      await fetch(`/api/train/launch?profile=${activeProfile}`, { method: 'POST' });
      await fetchTrainingData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stopTraining = async () => {
    setLoading(true);
    try {
      await fetch('/api/train/stop', { method: 'POST' });
      await fetchTrainingData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="training" className="relative space-y-6 py-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <GemCpu size={16} glow={true} />
            <span className="text-[11px] uppercase font-semibold tracking-wider text-purple-400">
              SECTION 3: REINFORCEMENT LEARNING CONVERGENCE
            </span>
          </div>
          <h2 className="text-3xl font-light tracking-tight text-white mt-1">
            PPO Training Monitor
          </h2>
          <p className="text-xs text-gray-400 max-w-xl mt-1">
            Real-time loss landscapes and entropy progression for the PPO agent under runtime action masking.
            Validation gates enforce zero policy violations before issuing deployable model checkpoints.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
          <select
            value={activeProfile}
            onChange={(e) => setActiveProfile(e.target.value)}
            disabled={status?.is_running}
            className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs text-gray-200 outline-none"
          >
            <option value="quick">Quick Profile (50k steps, 5 seeds)</option>
            <option value="paper">Paper Profile (1M steps, 10 seeds)</option>
          </select>

          {status?.is_running ? (
            <button
              onClick={stopTraining}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-medium flex items-center space-x-1.5 transition-colors"
            >
              <Square size={13} className="fill-current" />
              <span>Stop Training</span>
            </button>
          ) : (
            <button
              onClick={launchTraining}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Play size={13} className="fill-current" />
              <span>Launch Training</span>
            </button>
          )}

          <button
            onClick={fetchTrainingData}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Curves & Checkpoints */}
        <div className="lg:col-span-8 space-y-6">
          <FramedMockupCard caption="Historical & Live PPO Metrics" subcaption="results/train_log.jsonl">
            <div className="space-y-4">
              {/* Metrics Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-black/40 border border-white/5 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 font-mono">Total Steps Tracked</span>
                  <div className="text-base font-semibold text-white">
                    {metrics.length > 0 ? `${metrics[metrics.length - 1].timesteps?.toLocaleString()}` : '50,000'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-mono">Final Entropy Loss</span>
                  <div className="text-base font-semibold text-purple-300">
                    {metrics.length > 0 ? `${metrics[metrics.length - 1].entropy_loss?.toFixed(3)}` : '-1.264'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-mono">Value Loss (MSE)</span>
                  <div className="text-base font-semibold text-indigo-300">
                    {metrics.length > 0 ? `${metrics[metrics.length - 1].value_loss?.toFixed(3)}` : '0.485'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-mono">Explained Variance</span>
                  <div className="text-base font-semibold text-emerald-400">
                    {metrics.length > 0 ? `${metrics[metrics.length - 1].explained_variance?.toFixed(2)}` : '0.56'}
                  </div>
                </div>
              </div>

              {/* Data Table of Step Records */}
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-[10px] font-mono">
                      <th className="py-2 px-2">Timesteps</th>
                      <th className="py-2 px-2">Policy Loss</th>
                      <th className="py-2 px-2">Value Loss</th>
                      <th className="py-2 px-2">Entropy</th>
                      <th className="py-2 px-2">Approx KL</th>
                      <th className="py-2 px-2">Clip Frac</th>
                      <th className="py-2 px-2">Explained Var</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] font-mono text-[11px]">
                    {metrics.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500 text-xs">
                          No streamed training iterations in results/train_log.jsonl yet. Click "Launch Training" to run.
                        </td>
                      </tr>
                    ) : (
                      metrics.map((m, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="py-1.5 px-2 text-white font-medium">{m.timesteps}</td>
                          <td className="py-1.5 px-2 text-rose-300">{m.policy_loss?.toFixed(4)}</td>
                          <td className="py-1.5 px-2 text-indigo-300">{m.value_loss?.toFixed(4)}</td>
                          <td className="py-1.5 px-2 text-purple-300">{m.entropy_loss?.toFixed(4)}</td>
                          <td className="py-1.5 px-2 text-gray-300">{m.approx_kl?.toFixed(4)}</td>
                          <td className="py-1.5 px-2 text-amber-300">{m.clip_fraction?.toFixed(3)}</td>
                          <td className="py-1.5 px-2 text-emerald-300">{m.explained_variance?.toFixed(3)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </FramedMockupCard>

          {/* Model Checkpoint Validation Gates */}
          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Checkpoint Validation Gates</h3>
              </div>
              <span className="text-[11px] text-gray-400 font-mono">Criterion: Zero Policy Violations</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {status?.checkpoints?.map((chk: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <div className="flex items-center justify-between font-mono font-medium text-gray-200">
                    <span>{chk.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {chk.validation_gate}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400">Size: {chk.size_kb} KB • Modified: {chk.modified}</div>
                  <div className="text-[10px] text-gray-500 font-mono">
                    Zero Policy Violations: {chk.zero_policy_violations ? '✓ Verified' : 'Unmasked Baseline'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Table I Hyperparameters & Live Log Tail */}
        <div className="lg:col-span-4 space-y-4">
          {/* Table I Hyperparameters Card */}
          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center space-x-2">
                <Cpu size={16} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Table I Hyperparameters</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                PPO Specification
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono text-gray-300">
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-gray-400">Algorithm:</span>
                <span className="text-white">PPO MultiInput</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-gray-400">Learning Rate:</span>
                <span className="text-indigo-300">3e-4</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-gray-400">Rollout Steps / Ep:</span>
                <span className="text-white">2,048</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-gray-400">Mini-batch Size:</span>
                <span className="text-white">64</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-gray-400">Clip Range (eps):</span>
                <span className="text-white">0.20</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-gray-400">Entropy Coef:</span>
                <span className="text-purple-300">0.01</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-gray-400">Discount (gamma):</span>
                <span className="text-white">0.99</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-gray-400">Budget Factor kappa:</span>
                <span className="text-amber-300">1500.0</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Action Masking:</span>
                <span className="text-emerald-400">Runtime Shield F_t</span>
              </div>
            </div>
          </div>

          {/* Training Process Subprocess Live Log Tail */}
          <div className="p-4 rounded-2xl bg-black/80 border border-white/10 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center space-x-1.5">
                <Terminal size={14} className="text-emerald-400" />
                <span className="font-semibold text-gray-200">Subprocess Log Output</span>
              </div>
              <span className="text-[10px] font-mono">{logs.length} lines</span>
            </div>

            <div className="p-3 rounded-xl bg-black/90 border border-white/5 font-mono text-[10px] text-gray-300 h-48 overflow-y-auto space-y-1">
              {logs.length === 0 ? (
                <div className="text-gray-600 italic">No active logs. Click "Launch Training" to start subprocess.</div>
              ) : (
                logs.map((line, idx) => (
                  <div key={idx} className="leading-tight text-gray-400 hover:text-gray-200">
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
