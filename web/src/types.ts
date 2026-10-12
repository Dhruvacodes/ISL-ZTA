export interface StageLatencies {
  context: number;
  risk: number;
  mask: number;
  budget: number;
  arbitrate: number;
  shield: number;
  enforce: number;
  audit: number;
  total: number;
  [key: string]: number;
}

export interface DecisionEvent {
  timestamp_hr: number;
  raw_timestamp: number;
  principal: string;
  resource: string;
  operation: string;
  volume: number;
  risk_score: number;
  risk_features?: Record<string, number>;
  mask: number[];
  feasible_set: number[];
  proposed: string;
  executed: string;
  overridden: boolean;
  veto_reason?: string;
  budget: number;
  charge: number;
  charge_terms?: {
    kappa: number;
    v: number;
    sigma: number;
    rho_pow_p: number;
    total_charge: number;
  };
  is_attack: boolean;
  cum_malicious_volume: number;
  cum_target_volume: number;
  latencies?: Record<string, number>;
  triggered_rules?: string[];
}

export interface ControllerStats {
  shield_active: boolean;
  useful_work: { mean: number; ci95: [number, number] };
  attack_loss: { mean: number; ci95: [number, number] };
  attack_success_rate: { mean: number; ci95: [number, number] };
  pvr_percent: number;
  false_denials_per_ep: number;
  shield_interventions_per_ep: number;
  decision_distribution: Record<string, { count: number; pct: number }>;
  latency: {
    decision_ms: { mean: number; p50: number; p95: number; p99: number };
    e2e_ms: { mean: number; p50: number; p95: number; p99: number };
  };
}

export interface EvalSummary {
  metadata: {
    disclaimer: string;
    profile: string;
    seeds_count: number;
    total_decisions_evaluated: number;
    headline_finding?: string;
    system_info?: Record<string, any>;
  };
  controllers: Record<string, ControllerStats>;
  ablations?: Record<string, any>;
  sensitivities?: {
    budget_and_refill_grid?: Record<string, any>;
    exponent_p_grid?: Record<string, any>;
  };
  latency_breakdown_ms?: Record<string, any>;
}

export interface SystemInfo {
  status: string;
  profile: string;
  git_commit: string;
  opa_available: boolean;
  opa_version: string;
  python_version: string;
  platform: string;
  sqlite_wal_enabled: boolean;
  policy_hash: string;
  policy_backend: string;
  default_seeds: number;
  disclaimer: string;
}

export interface AcceptanceCriterion {
  id: string;
  title: string;
  passed: boolean;
  detail: string;
}

export interface BreakItScenario {
  id: string;
  title: string;
  desc: string;
  expected: string;
}

export interface AuditRecord {
  record_id?: number;
  correlation_id: string;
  request_id: string;
  principal: string;
  decision_timestamp: number;
  evidence_timestamp: number;
  policy_version_hash: string;
  model_version_hash: string;
  risk_score: number;
  budget_before: number;
  budget_after: number;
  policy_mask: number[];
  feasible_set: number[];
  proposed_action: number;
  executed_action: number;
  triggered_rules: string[];
  record_hash?: string;
  prev_record_hash?: string;
}

export interface TestFileStatus {
  name: string;
  tests: { name: string; duration: number; passed: boolean }[];
  passed: number;
  failed: number;
  duration: number;
}
