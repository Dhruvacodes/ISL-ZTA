import React, { useState, useEffect } from 'react';
import { FramedMockupCard } from '../components/FramedMockupCard';
import { GemDiamond, GemShield, GemRisk } from '../components/Gems';
import { ShieldCheck, Activity, Users, Server, Database, Layers } from 'lucide-react';

export const SimulatorSection: React.FC = () => {
  const [manifest, setManifest] = useState<any>(null);

  useEffect(() => {
    fetch('/api/simulator/manifest')
      .then((r) => r.json())
      .then((data) => setManifest(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <section id="simulator" className="relative space-y-6 py-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <GemDiamond size={16} glow={true} />
            <span className="text-[11px] uppercase font-semibold tracking-wider text-purple-400">
              SECTION 8: DISCRETE-EVENT SYNTHESIS
            </span>
          </div>
          <h2 className="text-3xl font-light tracking-tight text-white mt-1">
            Simulator Workload & Split Inspector
          </h2>
          <p className="text-xs text-gray-400 max-w-xl mt-1">
            Synthetic discrete-event environment architecture. Inspect principal distributions, resource sensitivity
            assignments, and the strict observation isolation barrier preventing ground-truth reward leakage.
          </p>
        </div>

        {/* Data Leakage Check Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-mono">
          <ShieldCheck size={14} />
          <span>Observation Barrier: Ground-Truth Isolated</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Splits and Principals */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Users size={16} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">100 Synthetic Principals (60 / 20 / 20 Split)</h3>
              </div>
              <span className="text-[10px] font-mono text-gray-400">Fixed Disjoint Partitions</span>
            </div>

            {/* Split Visualizer Bar */}
            <div className="space-y-1.5">
              <div className="h-4 rounded-full overflow-hidden flex bg-white/5 p-0.5">
                <div className="bg-indigo-500 h-full rounded-l-full w-[60%]" title="Train (60%)" />
                <div className="bg-purple-500 h-full w-[20%]" title="Validation (20%)" />
                <div className="bg-cyan-500 h-full rounded-r-full w-[20%]" title="Test (20%)" />
              </div>

              <div className="flex justify-between text-[11px] font-mono text-gray-400">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>Train (60)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Validation (20)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span>Test (20)</span>
                </span>
              </div>
            </div>

            {/* Role Distribution Grid */}
            <div className="pt-2">
              <span className="text-[10px] text-gray-400 uppercase font-mono block mb-2">Role Stratification:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {Object.entries(manifest?.role_distribution || {}).map(([role, count]: [string, any]) => (
                  <div key={role} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="text-gray-400 text-[10px] uppercase truncate">{role}</div>
                    <div className="text-white font-semibold mt-0.5">{count} principals</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resource Catalog */}
          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database size={16} className="text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Resource Catalogue & Sensitivity sigma</h3>
              </div>
              <span className="text-[10px] font-mono text-gray-400">Sec. 3.2 Catalogue</span>
            </div>

            <div className="overflow-x-auto max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-[10px] font-mono">
                    <th className="py-2 px-2">Resource</th>
                    <th className="py-2 px-2">Department</th>
                    <th className="py-2 px-2">Sensitivity (sigma)</th>
                    <th className="py-2 px-2">Allowed Roles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-mono text-[11px]">
                  {manifest?.resources?.map((r: any) => (
                    <tr key={r.name} className="hover:bg-white/[0.02]">
                      <td className="py-1.5 px-2 text-white font-sans">{r.name}</td>
                      <td className="py-1.5 px-2 text-gray-400">{r.department}</td>
                      <td className="py-1.5 px-2 text-rose-300 font-semibold">{r.sensitivity}</td>
                      <td className="py-1.5 px-2 text-gray-300 truncate max-w-[120px]">{r.read_roles?.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Attack Families & Timeline Previews */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GemRisk size={16} glow={true} />
                <h3 className="text-sm font-semibold text-white">6 Adversarial Threat Models</h3>
              </div>
              <span className="text-[10px] font-mono text-gray-400">Role-Authorized High-Value Targets</span>
            </div>

            <div className="space-y-2">
              {manifest?.attack_families?.map((fam: any) => (
                <div key={fam.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-white">{fam.name}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{fam.pacing}</div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 shrink-0">
                    p = {fam.prevalence}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Invariant Isolation Note */}
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-gray-300 space-y-1.5">
            <div className="font-semibold text-indigo-300 flex items-center space-x-1.5">
              <ShieldCheck size={14} />
              <span>Observation Ground-Truth Isolation Guarantee</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              In strict accordance with Section 2 Rule 1, agent observation states <strong className="text-white">s_t</strong> are
              rigorously constructed without access to simulator ground truth (<code className="text-indigo-300">ground_truth_is_attack</code> or
              <code className="text-indigo-300">target_volume</code>). The policy arbitrates purely based on noisy telemetry, sliding window history,
              and authenticated tokens.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
