import React, { useState, useEffect } from 'react';
import { FramedMockupCard } from '../components/FramedMockupCard';
import { GemDiamond, GemPolicy, GemBudget } from '../components/Gems';
import { CheckCircle2, Sliders, Play, Code, Database, Info, Sparkles } from 'lucide-react';

export const PolicyBudgetSection: React.FC = () => {
  const [policyInfo, setPolicyInfo] = useState<any>(null);
  const [principals, setPrincipals] = useState<any[]>([]);

  // What-if request fields
  const [whatifPrincipal, setWhatifPrincipal] = useState('eng_01');
  const [whatifRole, setWhatifRole] = useState('engineering');
  const [whatifResource, setWhatifResource] = useState('src_repo');
  const [whatifVolume, setWhatifVolume] = useState(0.05);
  const [whatifPosture, setWhatifPosture] = useState(0.85);
  const [whatifAlerts, setWhatifAlerts] = useState(0);
  const [whatifResult, setWhatifResult] = useState<any>(null);

  // Playground sliders
  const [sliderKappa, setSliderKappa] = useState(1500);
  const [sliderP, setSliderP] = useState(2.0);
  const [sliderBMax, setSliderBMax] = useState(100.0);
  const [sliderEta, setSliderEta] = useState(1.0);
  const [sliderRho, setSliderRho] = useState(0.25);
  const [sliderSigma, setSliderSigma] = useState(0.5);
  const [sliderVolume, setSliderVolume] = useState(0.05);
  const [playgroundResult, setPlaygroundResult] = useState<any>(null);

  const fetchPolicyData = async () => {
    try {
      const [pRes, bRes] = await Promise.all([
        fetch('/api/policy/info'),
        fetch('/api/budget/principals'),
      ]);
      setPolicyInfo(await pRes.json());
      setPrincipals(await bRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const evaluateWhatIf = async () => {
    try {
      const res = await fetch('/api/policy/whatif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          principal: whatifPrincipal,
          role: whatifRole,
          resource: whatifResource,
          volume: whatifVolume,
          device_posture: whatifPosture,
          unresolved_alerts: whatifAlerts,
        }),
      });
      const data = await res.json();
      setWhatifResult(data);
    } catch (err) {
      console.error(err);
    }
  };

  const calculatePlayground = async () => {
    try {
      const res = await fetch('/api/budget/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kappa: sliderKappa,
          p: sliderP,
          b_max: sliderBMax,
          eta: sliderEta,
          risk: sliderRho,
          sensitivity: sliderSigma,
          volume: sliderVolume,
        }),
      });
      const data = await res.json();
      setPlaygroundResult(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPolicyData();
    evaluateWhatIf();
  }, []);

  useEffect(() => {
    calculatePlayground();
  }, [sliderKappa, sliderP, sliderBMax, sliderEta, sliderRho, sliderSigma, sliderVolume]);

  return (
    <section id="policy" className="relative space-y-6 py-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <GemPolicy size={16} glow={true} />
            <span className="text-[11px] uppercase font-semibold tracking-wider text-cyan-400">
              SECTION 7: POLICY ENGINE & BUDGET MECHANICS
            </span>
          </div>
          <h2 className="text-3xl font-light tracking-tight text-white mt-1">
            Policy & Budget Inspector
          </h2>
          <p className="text-xs text-gray-400 max-w-xl mt-1">
            Authoritative Rego policy bundle viewer, interactive what-if query tester, active principal budget balances,
            and an interactive Equation 4-6 formula playground.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: What-if Tester & Rego Bundle Viewer */}
        <div className="lg:col-span-6 space-y-6">
          {/* What-If Tester Card */}
          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles size={16} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">What-If Request Evaluator</h3>
              </div>
              <button
                onClick={evaluateWhatIf}
                className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium hover:bg-indigo-500/30 flex items-center space-x-1"
              >
                <Play size={12} />
                <span>Evaluate</span>
              </button>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-gray-400 font-mono block mb-1">Principal</label>
                <input
                  type="text"
                  value={whatifPrincipal}
                  onChange={(e) => setWhatifPrincipal(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white font-mono text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-mono block mb-1">Role</label>
                <select
                  value={whatifRole}
                  onChange={(e) => setWhatifRole(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs outline-none"
                >
                  <option value="engineering">Engineering</option>
                  <option value="finance">Finance</option>
                  <option value="support">Support</option>
                  <option value="executive">Executive</option>
                  <option value="security">Security</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-mono block mb-1">Resource</label>
                <select
                  value={whatifResource}
                  onChange={(e) => setWhatifResource(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs outline-none"
                >
                  <option value="src_repo">src_repo (Eng)</option>
                  <option value="billing_db">billing_db (Fin)</option>
                  <option value="customer_profile">customer_profile (Sup)</option>
                  <option value="prod_secrets">prod_secrets (Crit)</option>
                  <option value="quarterly_reports">quarterly_reports (Exec)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-mono block mb-1">Volume ({whatifVolume})</label>
                <input
                  type="range"
                  min="0.01"
                  max="1.0"
                  step="0.01"
                  value={whatifVolume}
                  onChange={(e) => setWhatifVolume(parseFloat(e.target.value))}
                  className="w-full accent-indigo-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-mono block mb-1">Posture ({whatifPosture})</label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={whatifPosture}
                  onChange={(e) => setWhatifPosture(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-mono block mb-1">Alerts ({whatifAlerts})</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={whatifAlerts}
                  onChange={(e) => setWhatifAlerts(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 text-white font-mono text-xs outline-none"
                />
              </div>
            </div>

            {/* Results Table */}
            {whatifResult && (
              <div className="pt-2 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-mono">
                    Computed Risk rho_t: <strong className="text-rose-400">{whatifResult.risk_score}</strong>
                  </span>
                  <span className="text-gray-400 font-mono">
                    Budget Balance: <strong className="text-amber-400">{whatifResult.current_budget}</strong>
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                  <span className="text-[10px] text-gray-400 uppercase font-mono block">Feasible Action Breakdown:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[11px]">
                    {whatifResult.actions_breakdown?.map((ab: any) => (
                      <div
                        key={ab.action}
                        className={`p-1.5 rounded-lg border ${
                          ab.shield_feasible
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{ab.action}</span>
                          <span>{ab.shield_feasible ? '✓' : '✕'}</span>
                        </div>
                        {ab.veto_reason && (
                          <div className="text-[9px] text-gray-400 truncate mt-0.5">{ab.veto_reason}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rego Bundle Viewer Card */}
          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code size={16} className="text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Rego Bundle (access.rego)</h3>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-mono">
                <span className="text-gray-400">Hash: {policyInfo?.policy_hash?.slice(0, 10)}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Parity: Verified
                </span>
              </div>
            </div>

            <pre className="p-3.5 rounded-xl bg-black/80 border border-white/5 text-[11px] font-mono text-gray-300 h-44 overflow-y-auto leading-relaxed">
              {policyInfo?.rego_source || '# Loading access.rego...'}
            </pre>
          </div>
        </div>

        {/* Right: Equation 4-6 Formula Playground & Active Balances */}
        <div className="lg:col-span-6 space-y-6">
          {/* Interactive Formula Playground */}
          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Sliders size={16} className="text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Eq. 4-6 Formula Playground</h3>
              </div>
              <span className="text-[11px] font-mono text-amber-300">
                Charge: {playgroundResult?.nominal_charge?.toFixed(4) || '—'}
              </span>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex justify-between text-gray-400 font-mono text-[10px] mb-1">
                  <span>Scaling kappa</span>
                  <span className="text-white">{sliderKappa}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="3000"
                  step="50"
                  value={sliderKappa}
                  onChange={(e) => setSliderKappa(parseFloat(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-gray-400 font-mono text-[10px] mb-1">
                  <span>Exponent p</span>
                  <span className="text-white">{sliderP}</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.5"
                  value={sliderP}
                  onChange={(e) => setSliderP(parseFloat(e.target.value))}
                  className="w-full accent-purple-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-gray-400 font-mono text-[10px] mb-1">
                  <span>Capacity B_max</span>
                  <span className="text-white">{sliderBMax}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="10"
                  value={sliderBMax}
                  onChange={(e) => setSliderBMax(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-gray-400 font-mono text-[10px] mb-1">
                  <span>Refill eta / min</span>
                  <span className="text-white">{sliderEta}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.2"
                  value={sliderEta}
                  onChange={(e) => setSliderEta(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-gray-400 font-mono text-[10px] mb-1">
                  <span>Risk rho_t</span>
                  <span className="text-rose-300">{sliderRho}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={sliderRho}
                  onChange={(e) => setSliderRho(parseFloat(e.target.value))}
                  className="w-full accent-rose-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-gray-400 font-mono text-[10px] mb-1">
                  <span>Sensitivity sigma</span>
                  <span className="text-white">{sliderSigma}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={sliderSigma}
                  onChange={(e) => setSliderSigma(parseFloat(e.target.value))}
                  className="w-full accent-indigo-400"
                />
              </div>
            </div>

            {/* Formula display */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/5 font-mono text-[11px] text-gray-300 space-y-1">
              <div className="text-amber-400 font-semibold">
                C_t = {sliderKappa} × {sliderVolume} × {sliderSigma} × ({sliderRho})^{sliderP} = {playgroundResult?.nominal_charge?.toFixed(4)}
              </div>
              <div className="text-gray-400 text-[10px]">
                {playgroundResult?.exceeds_bmax ? (
                  <span className="text-rose-400 font-semibold">⚠ Charge exceeds B_max ({sliderBMax}): Shield will veto ALLOW</span>
                ) : (
                  <span className="text-emerald-400">✓ Feasible within budget capacity</span>
                )}
              </div>
            </div>
          </div>

          {/* Active Principal Balances Table */}
          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database size={16} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Active Principal Budget Balances</h3>
              </div>
              <span className="text-[10px] font-mono text-gray-400">Live WAL Store</span>
            </div>

            <div className="overflow-x-auto max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-[10px] font-mono">
                    <th className="py-2 px-2">Principal</th>
                    <th className="py-2 px-2">Role</th>
                    <th className="py-2 px-2">Balance</th>
                    <th className="py-2 px-2">Capacity</th>
                    <th className="py-2 px-2">Refill Gate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-mono text-[11px]">
                  {principals.map((p) => (
                    <tr key={p.principal_id} className="hover:bg-white/[0.02]">
                      <td className="py-1.5 px-2 text-white font-sans">{p.principal_id}</td>
                      <td className="py-1.5 px-2 text-gray-400">{p.role}</td>
                      <td className="py-1.5 px-2 text-amber-300 font-semibold">{p.balance}</td>
                      <td className="py-1.5 px-2 text-gray-400">{p.max_balance}</td>
                      <td className="py-1.5 px-2 text-emerald-400">{p.refill_rate}/min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
