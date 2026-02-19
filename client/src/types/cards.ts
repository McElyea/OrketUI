export type CardType = 'rock' | 'epic' | 'issue' | 'utility' | 'app';

export type CardStatus =
  | 'ready'
  | 'in_progress'
  | 'blocked'
  | 'waiting_for_developer'
  | 'ready_for_testing'
  | 'code_review'
  | 'awaiting_guard_review'
  | 'guard_approved'
  | 'guard_rejected'
  | 'guard_requested_changes'
  | 'done'
  | 'canceled'
  | 'archived';

export type WaitReason = 'resource' | 'dependency' | 'review' | 'input' | 'system';

export interface IssueMetrics {
  score: number;
  grade: string;
  audit_date?: string;
  criteria_scores: Record<string, number>;
  shippability_threshold: number;
  path_delta?: number;
}

export interface VerificationScenario {
  id: string;
  description: string;
  input_data: Record<string, unknown>;
  expected_output: unknown;
  actual_output?: unknown;
  status: 'pass' | 'fail' | 'pending';
}

export interface VerificationResult {
  timestamp: string;
  total_scenarios: number;
  passed: number;
  failed: number;
  logs: string[];
}

export interface IssueVerification {
  fixture_path?: string;
  scenarios: VerificationScenario[];
  last_run?: VerificationResult;
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  status: CardStatus;
  description?: string;
  priority: number;
  wait_reason?: WaitReason;
  note?: string;
  parent_id?: string;
  build_id?: string;
  owner_department?: string;
  labels: string[];
  params: Record<string, unknown>;
  references: string[];
  // Issue-specific
  seat?: string;
  assignee?: string;
  sprint?: string;
  requirements?: string;
  depends_on?: string[];
  retry_count?: number;
  max_retries?: number;
  verification?: IssueVerification;
  metrics?: IssueMetrics;
  // Timestamps
  session_id?: string;
  created_at?: string;
}

export interface CardTransition {
  from_status: CardStatus;
  to_status: CardStatus;
  timestamp: string;
  reason?: string;
  actor?: string;
}

export interface CardHistory {
  card_id: string;
  transitions: CardTransition[];
}

export interface CardComment {
  id: string;
  card_id: string;
  author: string;
  content: string;
  timestamp: string;
}
