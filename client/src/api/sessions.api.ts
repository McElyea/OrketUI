import { api } from './client';
import type {
  Run,
  RunMetrics,
  SessionDetails,
  SessionStatus,
  SessionSnapshot,
  ReplayTurn,
  BacklogItem,
  ExecutionGraph,
  ExecutionGraphEdge,
  ExecutionGraphNode,
} from '@/types/sessions';

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as AnyRecord;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeRunStatus(raw: unknown): Run['status'] {
  const value = String(raw ?? '').toLowerCase();

  if (value === 'started' || value === 'running' || value === 'in_progress') return 'running';
  if (value === 'done' || value === 'completed' || value === 'success') return 'completed';
  if (value === 'failed' || value === 'error') return 'failed';
  if (value === 'halted' || value === 'stopped' || value === 'cancelled') return 'halted';

  return 'idle';
}

function toRun(raw: AnyRecord): Run {
  return {
    session_id: String(raw.session_id ?? raw.id ?? ''),
    build_id: typeof raw.build_id === 'string' ? raw.build_id : undefined,
    type: typeof raw.type === 'string' ? raw.type : undefined,
    status: normalizeRunStatus(raw.status),
    started_at: String(raw.started_at ?? raw.start_time ?? ''),
    ended_at: typeof raw.ended_at === 'string'
      ? raw.ended_at
      : typeof raw.end_time === 'string'
        ? raw.end_time
        : undefined,
    summary: raw.summary as Run['summary'],
    artifacts: Array.isArray(raw.artifacts) ? (raw.artifacts as string[]) : undefined,
  };
}

function toBacklogItem(raw: AnyRecord): BacklogItem {
  return {
    issue_id: String(raw.issue_id ?? raw.id ?? ''),
    name: String(raw.name ?? raw.summary ?? raw.issue_id ?? raw.id ?? 'Untitled'),
    status: String(raw.status ?? 'ready') as BacklogItem['status'],
    priority: Number(raw.priority ?? 1),
    seat: typeof raw.seat === 'string' ? raw.seat : undefined,
  };
}

function toExecutionGraphNode(raw: AnyRecord): ExecutionGraphNode {
  return {
    id: String(raw.id ?? ''),
    summary: typeof raw.summary === 'string' ? raw.summary : undefined,
    seat: typeof raw.seat === 'string' ? raw.seat : undefined,
    status: typeof raw.status === 'string' ? raw.status : undefined,
    depends_on: Array.isArray(raw.depends_on) ? raw.depends_on.map((value) => String(value)) : [],
    dependency_count: typeof raw.dependency_count === 'number' ? raw.dependency_count : undefined,
    blocked: typeof raw.blocked === 'boolean' ? raw.blocked : undefined,
    blocked_by: Array.isArray(raw.blocked_by) ? raw.blocked_by.map((value) => String(value)) : [],
    unresolved_dependencies: Array.isArray(raw.unresolved_dependencies)
      ? raw.unresolved_dependencies.map((value) => String(value))
      : [],
    in_degree: typeof raw.in_degree === 'number' ? raw.in_degree : undefined,
    order_index: typeof raw.order_index === 'number' ? raw.order_index : undefined,
  };
}

function toExecutionGraphEdge(raw: AnyRecord): ExecutionGraphEdge {
  const inferredKind = typeof raw.kind === 'string'
    ? raw.kind
    : typeof raw.type === 'string'
      ? raw.type
      : 'depends_on';

  return {
    source: String(raw.source ?? ''),
    target: String(raw.target ?? ''),
    kind: inferredKind as ExecutionGraphEdge['kind'],
    source_event: typeof raw.source_event === 'string' ? raw.source_event : undefined,
    timestamp: typeof raw.timestamp === 'string' ? raw.timestamp : undefined,
  };
}

function toExecutionGraph(raw: AnyRecord): ExecutionGraph {
  const container = asRecord(raw.graph) ?? raw;
  const nodes = Array.isArray(container.nodes)
    ? container.nodes.map((item) => toExecutionGraphNode(item as AnyRecord))
    : [];
  const edges = Array.isArray(container.edges)
    ? container.edges.map((item) => toExecutionGraphEdge(item as AnyRecord))
    : [];

  return {
    session_id: String(container.session_id ?? raw.session_id ?? ''),
    node_count: typeof container.node_count === 'number' ? container.node_count : nodes.length,
    edge_count: typeof container.edge_count === 'number' ? container.edge_count : edges.length,
    nodes,
    edges,
    execution_order: Array.isArray(container.execution_order)
      ? container.execution_order.map((value) => String(value))
      : [],
    has_cycle: Boolean(container.has_cycle),
    cycle_nodes: Array.isArray(container.cycle_nodes)
      ? container.cycle_nodes.map((value) => String(value))
      : [],
  };
}

function toReplayTurn(raw: AnyRecord): ReplayTurn {
  const inputTokens = asNumber(raw.input_tokens);
  const outputTokens = asNumber(raw.output_tokens);
  const nestedUsage = asRecord(raw.usage);
  const usageTotal = asNumber(nestedUsage?.total_tokens);
  const tokenTotal = asNumber(raw.tokens, asNumber(raw.total_tokens, usageTotal || inputTokens + outputTokens));

  const durationMs = asNumber(raw.duration_ms, asNumber(raw.duration, asNumber(raw.elapsed_ms)));
  const toolCalls = asArray<AnyRecord>(raw.tool_calls ?? raw.tools).map((tool) => ({
    name: asString(tool.name, asString(tool.tool)),
    arguments: asRecord(tool.arguments ?? tool.args) ?? {},
    result: tool.result,
  }));

  return {
    turn_index: asNumber(raw.turn_index, asNumber(raw.turn, asNumber(raw.index))),
    role: asString(raw.role, asString(raw.seat, 'unknown')),
    issue_id: asString(raw.issue_id, asString(raw.card_id, '')),
    selected_model: asString(raw.selected_model, asString(raw.model, asString(raw.model_name, ''))),
    prompt_id: asOptionalString(raw.prompt_id),
    thought: asOptionalString(raw.thought) ?? asOptionalString(raw.reasoning),
    content: asOptionalString(raw.content) ??
      asOptionalString(raw.output) ??
      asOptionalString(raw.response) ??
      asOptionalString(raw.text),
    tool_calls: toolCalls,
    tokens: tokenTotal,
    duration_ms: durationMs,
    timestamp: asString(raw.timestamp, asString(raw.created_at, new Date().toISOString())),
    guard_decision: asRecord(raw.guard_decision) as unknown as ReplayTurn['guard_decision'],
  };
}

export const sessionsApi = {
  listRuns: async () => {
    const res = await api.get<AnyRecord[] | { runs?: AnyRecord[]; items?: AnyRecord[] }>('/runs');
    const rows = Array.isArray(res)
      ? res
      : Array.isArray(res.runs)
        ? res.runs
        : Array.isArray(res.items)
          ? res.items
          : [];
    return rows.map(toRun);
  },

  getRun: async (sessionId: string) => {
    const res = await api.get<AnyRecord>(`/runs/${sessionId}`);
    const row = asRecord(res.run) ?? asRecord(res.session) ?? res;
    return toRun(row);
  },

  getRunMetrics: (sessionId: string) =>
    api.get<RunMetrics>(`/runs/${sessionId}/metrics`),

  getRunBacklog: async (sessionId: string) => {
    const res = await api.get<AnyRecord[] | { backlog?: AnyRecord[]; items?: AnyRecord[] }>(
      `/runs/${sessionId}/backlog`,
    );
    const rows = Array.isArray(res)
      ? res
      : Array.isArray(res.backlog)
        ? res.backlog
        : Array.isArray(res.items)
          ? res.items
          : [];
    return rows.map(toBacklogItem);
  },

  getExecutionGraph: async (sessionId: string) => {
    const row = await api.get<AnyRecord>(`/runs/${sessionId}/execution-graph`);
    return toExecutionGraph(row);
  },

  haltSession: (sessionId: string) =>
    api.post<void>(`/sessions/${sessionId}/halt`),

  getSession: (sessionId: string) => api.get<SessionDetails>(`/sessions/${sessionId}`),

  getSessionStatus: (sessionId: string) => api.get<SessionStatus>(`/sessions/${sessionId}/status`),

  getSessionSnapshot: (sessionId: string) =>
    api.get<SessionSnapshot>(`/sessions/${sessionId}/snapshot`),

  getReplayTurn: async (sessionId: string, issueId: string, turnIndex: number, role?: string) => {
    const params = new URLSearchParams();
    params.set('issue_id', issueId);
    params.set('turn_index', String(turnIndex));
    if (role) params.set('role', role);

    const raw = await api.get<AnyRecord>(`/sessions/${sessionId}/replay?${params.toString()}`);
    return toReplayTurn(raw);
  },
};
