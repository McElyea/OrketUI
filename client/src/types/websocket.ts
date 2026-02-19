import type { GuardDecision } from './guard';

export type RuntimeEventType =
  | 'session_start'
  | 'session_end'
  | 'turn_start'
  | 'turn_complete'
  | 'turn_failed'
  | 'runtime_verifier_completed'
  | 'guard_retry_scheduled'
  | 'guard_terminal_failure';

export interface RuntimeEvent {
  schema_version: string;
  event: RuntimeEventType;
  role: string;
  session_id: string;
  issue_id: string;
  turn_index: number;
  turn_trace_id?: string;
  selected_model?: string;
  prompt_id?: string;
  prompt_version?: string;
  prompt_checksum?: string;
  resolver_policy?: string;
  selection_policy?: string;
  duration_ms?: number;
  tokens?: number;
  guard_contract?: Record<string, unknown>;
  guard_decision?: GuardDecision;
  terminal_reason?: { code: string; message: string };
  timestamp: string;
}

export type ModelActivityState = 'reading' | 'thinking' | 'writing' | 'empty';

export interface RoleActivityEntry {
  role: string;
  model: string;
  state: ModelActivityState;
  issue_id?: string;
  turn_index?: number;
  timestamp: string;
}
