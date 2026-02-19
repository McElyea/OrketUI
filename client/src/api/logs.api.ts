import { api } from './client';

export interface LogEntry {
  timestamp: string;
  event: string;
  role?: string;
  session_id?: string;
  issue_id?: string;
  turn_index?: number;
  selected_model?: string;
  duration_ms?: number;
  tokens?: number;
  data?: Record<string, unknown>;
}

export interface LogQuery {
  session_id?: string;
  event?: string;
  role?: string;
  start_time?: string;
  end_time?: string;
  limit?: number;
  offset?: number;
}

type AnyRecord = Record<string, unknown>;

function toLogEntry(raw: AnyRecord): LogEntry {
  const nested = (raw.data && typeof raw.data === 'object') ? (raw.data as AnyRecord) : {};

  return {
    timestamp: String(raw.timestamp ?? ''),
    event: String(raw.event ?? ''),
    role: typeof raw.role === 'string' ? raw.role : undefined,
    session_id: typeof raw.session_id === 'string'
      ? raw.session_id
      : typeof nested.session_id === 'string'
        ? (nested.session_id as string)
        : undefined,
    issue_id: typeof raw.issue_id === 'string'
      ? raw.issue_id
      : typeof nested.issue_id === 'string'
        ? (nested.issue_id as string)
        : undefined,
    turn_index: typeof raw.turn_index === 'number'
      ? raw.turn_index
      : typeof nested.turn_index === 'number'
        ? (nested.turn_index as number)
        : undefined,
    selected_model: typeof raw.selected_model === 'string'
      ? raw.selected_model
      : typeof nested.selected_model === 'string'
        ? (nested.selected_model as string)
        : undefined,
    duration_ms: typeof raw.duration_ms === 'number'
      ? raw.duration_ms
      : typeof nested.duration_ms === 'number'
        ? (nested.duration_ms as number)
        : undefined,
    tokens: typeof raw.tokens === 'number'
      ? raw.tokens
      : typeof nested.tokens === 'number'
        ? (nested.tokens as number)
        : undefined,
    data: nested,
  };
}

export const logsApi = {
  query: async (params: LogQuery = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) qs.set(k, String(v));
    });
    const q = qs.toString();

    const res = await api.get<LogEntry[] | { items?: AnyRecord[] }>(`/logs${q ? `?${q}` : ''}`);
    if (Array.isArray(res)) {
      return res.map((entry) => toLogEntry(entry as unknown as AnyRecord));
    }

    const items = Array.isArray(res.items) ? res.items : [];
    return items.map(toLogEntry);
  },

  clear: () => api.post<void>('/system/clear-logs'),
};
