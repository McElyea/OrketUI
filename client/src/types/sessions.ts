import type { CardStatus } from './cards';
import type { GuardDecision } from './guard';

export interface Run {
  session_id: string;
  build_id?: string;
  type?: string;
  status: 'running' | 'completed' | 'failed' | 'halted' | 'idle';
  started_at: string;
  ended_at?: string;
  summary?: RunSummary;
  artifacts?: string[];
}

export interface RunSummary {
  total_issues: number;
  completed: number;
  failed: number;
  total_tokens: number;
  total_duration_ms: number;
}

export interface RunMetrics {
  session_id: string;
  turns: number;
  tokens_used: number;
  duration_ms: number;
  issues_completed: number;
  issues_failed: number;
}

export interface SessionDetails {
  session_id: string;
  status: string;
  started_at: string;
  current_issue?: string;
  current_role?: string;
}

export interface SessionStatus {
  session_id: string;
  active: boolean;
  current_phase?: string;
}

export interface SessionSnapshot {
  session_id: string;
  board: Record<string, unknown>;
  metrics: RunMetrics;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

export interface ReplayTurn {
  turn_index: number;
  role: string;
  issue_id: string;
  selected_model: string;
  prompt_id?: string;
  thought?: string;
  content?: string;
  tool_calls: ToolCall[];
  tokens: number;
  duration_ms: number;
  timestamp: string;
  guard_decision?: GuardDecision;
}

export interface BacklogItem {
  issue_id: string;
  name: string;
  status: CardStatus;
  priority: number;
  seat?: string;
}

export type ExecutionEdgeKind =
  | 'depends_on'
  | 'handoff'
  | 'spawn'
  | 'parallel_chain'
  | 'unknown';

export interface ExecutionGraphNode {
  id: string;
  summary?: string;
  seat?: string;
  status?: string;
  depends_on?: string[];
  dependency_count?: number;
  blocked?: boolean;
  blocked_by?: string[];
  unresolved_dependencies?: string[];
  in_degree?: number;
  order_index?: number;
}

export interface ExecutionGraphEdge {
  source: string;
  target: string;
  kind?: ExecutionEdgeKind;
  source_event?: string;
  timestamp?: string;
}

export interface ExecutionGraph {
  session_id: string;
  node_count: number;
  edge_count: number;
  nodes: ExecutionGraphNode[];
  edges: ExecutionGraphEdge[];
  execution_order: string[];
  has_cycle: boolean;
  cycle_nodes: string[];
}
