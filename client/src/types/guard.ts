export type GuardResult = 'pass' | 'fail';
export type GuardAction = 'pass' | 'retry' | 'terminal_failure';
export type GuardSeverity = 'soft' | 'strict';
export type GuardLocation = 'system' | 'user' | 'context' | 'output';

export interface TerminalReason {
  code: string;
  message: string;
}

export interface GuardViolation {
  rule_id: string;
  code: string;
  message: string;
  location: GuardLocation;
  severity: GuardSeverity;
  evidence?: string;
}

export interface GuardContract {
  result: GuardResult;
  violations: GuardViolation[];
  severity: GuardSeverity;
  fix_hint?: string;
  terminal_failure: boolean;
  terminal_reason?: TerminalReason;
}

export interface GuardDecision {
  action: GuardAction;
  next_retry_count: number;
  terminal_failure: boolean;
  terminal_reason?: TerminalReason;
  retry_fingerprint?: string;
  repeated_fingerprint: boolean;
}

export interface GuardReviewPayload {
  rationale: string;
  violations: string[];
  remediation_actions: string[];
}
