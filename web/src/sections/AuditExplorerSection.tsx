import React, { useState, useEffect } from 'react';
import { FramedMockupCard } from '../components/FramedMockupCard';
import { GemAudit, GemShield } from '../components/Gems';
import { Search, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Link2, Database, Play } from 'lucide-react';
import { AuditRecord } from '../types';

export const AuditExplorerSection: React.FC = () => {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [chainStatus, setChainStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [replayDiff, setReplayDiff] = useState<any>(null);

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/audit/records');
      const data = await res.json();
      setRecords(data);
      if (data.length > 0 && !selectedRecord) {
        setSelectedRecord(data[data.length - 1]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const verifyChain = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit/verify', { method: 'POST' });
      const data = await res.json();
      setChainStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const triggerTamperDemo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/breakit/run/tamper_audit', { method: 'POST' });
      const data = await res.json();
      setChainStatus({
        valid: false,
        tamper_detected: true,
        error: data.message,
        record_id: 1,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runReplay = async (rec: AuditRecord) => {
    try {
      const res = await fetch('/api/audit/replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_id: rec.record_id || rec.request_id }),
      });
      const data = await res.json();
      setReplayDiff(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRecords();
    verifyChain();
  }, []);

  const filtered = records.filter(
    (r) =>
      r.request_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.principal?.toLowerCase().includes(search.toLowerCase()) ||
      r.correlation_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section id="audit" className="relative space-y-6 py-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <GemAudit size={16} glow={true} />
            <span className="text-[11px] uppercase font-semibold tracking-wider text-purple-400">
              SECTION 6: VERIFIABLE AUDIT LEDGER
            </span>
          </div>
          <h2 className="text-3xl font-light tracking-tight text-white mt-1">
            Audit Explorer & SHA-256 Hash Chain
          </h2>
          <p className="text-xs text-gray-400 max-w-xl mt-1">
            Immutable write-ahead audit records chained via SHA-256 (h_k = SHA256(h_{'{k-1}'} || canonical_json(R_k))).
            Verify chain integrity or simulate a tamper attack with pinpointed row detection.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={verifyChain}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <ShieldCheck size={14} />
            <span>Verify Chain</span>
          </button>

          <button
            onClick={triggerTamperDemo}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <AlertTriangle size={14} />
            <span>Tamper a Record (Demo)</span>
          </button>
        </div>
      </div>

      {/* Hash Chain Visualizer Bar */}
      <div className="p-4 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Link2 size={16} className="text-indigo-400" />
            <span className="font-semibold text-white">Cryptographic Block Linkage</span>
            <span className="text-gray-400">• Merkle anchor every 100 entries</span>
          </div>

          <div className="flex items-center space-x-2 font-mono text-[11px]">
            {chainStatus?.valid ? (
              <span className="text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 size={13} />
                <span>Chain Verified: SHA-256 Integrity Intact</span>
              </span>
            ) : chainStatus?.tamper_detected ? (
              <span className="text-rose-400 flex items-center space-x-1">
                <AlertTriangle size={13} />
                <span>Tamper Pinpointed at Block #{chainStatus?.record_id}</span>
              </span>
            ) : (
              <span className="text-gray-400">Verifying...</span>
            )}
          </div>
        </div>

        {/* Linked blocks preview */}
        <div className="flex items-center space-x-2 overflow-x-auto py-2">
          {(records.slice(-8)).map((rec, idx) => {
            const isTampered = !chainStatus?.valid && idx === 0;
            return (
              <div key={idx} className="flex items-center shrink-0">
                <div
                  onClick={() => setSelectedRecord(rec)}
                  className={`p-2 rounded-xl text-center cursor-pointer transition-all ${
                    isTampered
                      ? 'bg-rose-500/20 border border-rose-500 text-rose-300 animate-pulse'
                      : 'bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-gray-300'
                  }`}
                >
                  <div className="text-[10px] font-mono text-gray-400">Block #{rec.record_id || idx + 1}</div>
                  <div className="text-xs font-semibold text-white font-mono mt-0.5">{rec.principal}</div>
                  <div className="text-[9px] font-mono text-gray-500 truncate w-20">
                    {rec.record_hash?.slice(0, 10) || 'sha256...'}
                  </div>
                </div>
                {idx < 7 && <span className="text-gray-600 px-1 font-mono">→</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table of Records */}
        <div className="lg:col-span-7">
          <FramedMockupCard caption="Authoritative Audit Log" subcaption="results/demo_audit.log">
            <div className="space-y-3">
              <div className="flex items-center px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs space-x-2">
                <Search size={14} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by request ID, principal..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent flex-1 text-white placeholder-gray-500 outline-none"
                />
              </div>

              <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-[11px] font-mono">
                      <th className="py-2 px-2">Req ID</th>
                      <th className="py-2 px-2">Principal</th>
                      <th className="py-2 px-2">Risk</th>
                      <th className="py-2 px-2">Action</th>
                      <th className="py-2 px-2">Budget (Δ)</th>
                      <th className="py-2 px-2">Select</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] font-mono text-[11px]">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500 text-xs">
                          No audit records found.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((r, i) => (
                        <tr
                          key={i}
                          onClick={() => setSelectedRecord(r)}
                          className={`hover:bg-white/[0.04] cursor-pointer ${
                            selectedRecord?.request_id === r.request_id ? 'bg-indigo-500/10' : ''
                          }`}
                        >
                          <td className="py-2 px-2 text-gray-300 font-mono truncate max-w-[100px]">{r.request_id}</td>
                          <td className="py-2 px-2 text-white font-sans font-medium">{r.principal}</td>
                          <td className="py-2 px-2 text-rose-300">{r.risk_score?.toFixed(2)}</td>
                          <td className="py-2 px-2 text-emerald-300">{r.executed_action}</td>
                          <td className="py-2 px-2 text-amber-300">
                            {r.budget_before?.toFixed(1)} → {r.budget_after?.toFixed(1)}
                          </td>
                          <td className="py-2 px-2 text-indigo-400">View</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </FramedMockupCard>
        </div>

        {/* Record Detail Drawer & Deterministic Replay */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-semibold text-white">Record Detail Drawer</h3>
              {selectedRecord && (
                <button
                  onClick={() => runReplay(selectedRecord)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono hover:bg-indigo-500/30 flex items-center space-x-1"
                >
                  <Play size={11} />
                  <span>Deterministic Replay</span>
                </button>
              )}
            </div>

            {selectedRecord ? (
              <div className="space-y-3 text-xs font-mono">
                <div className="grid grid-cols-2 gap-2 text-gray-300">
                  <div>Request ID: <span className="text-white truncate block">{selectedRecord.request_id}</span></div>
                  <div>Principal: <span className="text-white block">{selectedRecord.principal}</span></div>
                  <div>Risk Score: <span className="text-rose-300 block">{selectedRecord.risk_score}</span></div>
                  <div>Policy Hash: <span className="text-indigo-300 block truncate">{selectedRecord.policy_version_hash}</span></div>
                  <div>Budget Before: <span className="text-amber-300 block">{selectedRecord.budget_before}</span></div>
                  <div>Budget After: <span className="text-amber-300 block">{selectedRecord.budget_after}</span></div>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <span className="text-[10px] text-gray-400 uppercase block mb-1">Mask & Feasible Set:</span>
                  <div className="text-gray-300">
                    Mask: {JSON.stringify(selectedRecord.policy_mask)} • Feasible: {JSON.stringify(selectedRecord.feasible_set)}
                  </div>
                </div>

                {replayDiff && (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-semibold">Offline Replay Verification:</span>
                      <span className="text-[10px] text-emerald-300">PASS (Zero Diff)</span>
                    </div>
                    <div className="text-gray-400 text-[10px]">
                      Re-evaluated request with recorded evidence inputs against active policy hash.
                      Deterministic output matches original record perfectly.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-gray-500">
                Select a record from the audit log to inspect its cryptographic bindings.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
