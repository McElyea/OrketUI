import { ref, onUnmounted } from 'vue';
import type { RuntimeEvent } from '@/types/websocket';
import { WS_RECONNECT_MIN_MS, WS_RECONNECT_MAX_MS } from '@/utils/constants';

export type WsStatus = 'connecting' | 'connected' | 'disconnected';

export function useWebSocket(onEvent: (event: RuntimeEvent) => void) {
  const status = ref<WsStatus>('disconnected');
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout>;
  let reconnectDelay = WS_RECONNECT_MIN_MS;
  let connectOpened = false;
  let candidateIndex = 0;

  function wsCandidates(): string[] {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const fromEnv = import.meta.env.VITE_WS_URL as string | undefined;

    const candidates = [
      fromEnv,
      `${protocol}//${location.host}/ws/events`,
      `${protocol}//localhost:3001/ws/events`,
    ].filter((value): value is string => Boolean(value));

    return [...new Set(candidates)];
  }

  function connect() {
    if (ws && ws.readyState <= WebSocket.OPEN) return;

    status.value = 'connecting';
    connectOpened = false;
    const candidates = wsCandidates();
    const url = candidates[Math.min(candidateIndex, candidates.length - 1)];
    ws = new WebSocket(url);

    ws.onopen = () => {
      connectOpened = true;
      status.value = 'connected';
      reconnectDelay = WS_RECONNECT_MIN_MS;
      candidateIndex = 0;
    };

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as unknown;
        const normalized = normalizeRuntimeEvent(data);
        if (normalized) {
          onEvent(normalized);
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    ws.onclose = () => {
      status.value = 'disconnected';
      ws = null;

      const candidates = wsCandidates();
      // If socket never reached open, cycle candidate endpoints before backoff.
      if (!connectOpened && candidateIndex < candidates.length - 1) {
        candidateIndex += 1;
        connect();
        return;
      }

      candidateIndex = 0;
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws?.close();
    };
  }

  function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, WS_RECONNECT_MAX_MS);
      connect();
    }, reconnectDelay);
  }

  function disconnect() {
    clearTimeout(reconnectTimer);
    if (ws) {
      ws.onclose = null; // Prevent reconnect
      ws.close();
      ws = null;
    }
    status.value = 'disconnected';
  }

  onUnmounted(disconnect);

  return { status, connect, disconnect };
}

type AnyRecord = Record<string, unknown>;

const EVENT_ALIASES: Record<string, RuntimeEvent['event']> = {
  session_started: 'session_start',
  session_finished: 'session_end',
  runtime_verifier_complete: 'runtime_verifier_completed',
  guard_terminal: 'guard_terminal_failure',
  guard_terminal_failed: 'guard_terminal_failure',
};

const KNOWN_EVENTS = new Set<RuntimeEvent['event']>([
  'session_start',
  'session_end',
  'turn_start',
  'turn_complete',
  'turn_failed',
  'runtime_verifier_completed',
  'guard_retry_scheduled',
  'guard_terminal_failure',
]);

function asRecord(value: unknown): AnyRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as AnyRecord;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function resolvePayload(raw: unknown): AnyRecord | null {
  const root = asRecord(raw);
  if (!root) return null;

  if (root.type === 'connected') return null;

  const runtimeEvent = asRecord(root.runtime_event);
  if (runtimeEvent) return runtimeEvent;

  const payload = asRecord(root.payload);
  if (payload) return payload;

  const nestedEvent = asRecord(root.event);
  if (nestedEvent) return nestedEvent;

  return root;
}

function normalizeRuntimeEvent(raw: unknown): RuntimeEvent | null {
  const payload = resolvePayload(raw);
  if (!payload) return null;

  const rawEventName =
    asString(payload.event) ||
    asString(payload.event_type) ||
    asString(payload.type);

  if (!rawEventName) return null;

  const eventName = EVENT_ALIASES[rawEventName] ?? rawEventName;
  if (!KNOWN_EVENTS.has(eventName as RuntimeEvent['event'])) return null;

  const inputTokens = asNumber(payload.input_tokens) ?? 0;
  const outputTokens = asNumber(payload.output_tokens) ?? 0;
  const nestedUsage = asRecord(payload.usage);
  const usageTokens = asNumber(nestedUsage?.total_tokens);
  const tokens =
    asNumber(payload.tokens) ??
    asNumber(payload.total_tokens) ??
    usageTokens ??
    (inputTokens + outputTokens > 0 ? inputTokens + outputTokens : undefined);

  const durationMs =
    asNumber(payload.duration_ms) ??
    asNumber(payload.duration) ??
    asNumber(payload.elapsed_ms);

  return {
    schema_version: asString(payload.schema_version) || '1.0',
    event: eventName as RuntimeEvent['event'],
    role: asString(payload.role) || asString(payload.seat) || '',
    session_id: asString(payload.session_id) || asString(payload.run_id) || '',
    issue_id: asString(payload.issue_id) || asString(payload.card_id) || '',
    turn_index: asNumber(payload.turn_index) ?? asNumber(payload.turn) ?? 0,
    turn_trace_id: asString(payload.turn_trace_id),
    selected_model:
      asString(payload.selected_model) ||
      asString(payload.model) ||
      asString(payload.model_name),
    prompt_id: asString(payload.prompt_id),
    prompt_version: asString(payload.prompt_version),
    prompt_checksum: asString(payload.prompt_checksum),
    resolver_policy: asString(payload.resolver_policy),
    selection_policy: asString(payload.selection_policy),
    duration_ms: durationMs,
    tokens,
    guard_contract: asRecord(payload.guard_contract) || asRecord(payload.contract) || undefined,
    guard_decision:
      (asRecord(payload.guard_decision) || asRecord(payload.decision) || undefined) as RuntimeEvent['guard_decision'],
    terminal_reason: asRecord(payload.terminal_reason) as RuntimeEvent['terminal_reason'] | undefined,
    timestamp: asString(payload.timestamp) || asString(payload.created_at) || new Date().toISOString(),
  };
}
