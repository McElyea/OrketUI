import { api } from './client';
import type { Sandbox, SandboxLogs } from '@/types/settings';

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as AnyRecord;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asBool(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function normalizeSandbox(raw: unknown): Sandbox | null {
  const row = asRecord(raw);
  if (!row) return null;

  const running = asBool(row.running);
  const statusRaw = asString(row.status) || asString(row.state);
  const status = running === true
    ? 'running'
    : running === false
      ? 'stopped'
      : statusRaw === 'running'
        ? 'running'
        : 'stopped';

  const sandboxId =
    asString(row.sandbox_id) ||
    asString(row.id) ||
    asString(row.container_id);

  if (!sandboxId) return null;

  return {
    sandbox_id: sandboxId,
    status,
    created_at: asString(row.created_at) || asString(row.started_at) || new Date().toISOString(),
    issue_id: asString(row.issue_id) || asString(row.card_id),
    service: asString(row.service) || asString(row.name),
  };
}

function normalizeSandboxLogs(sandboxId: string, raw: unknown): SandboxLogs {
  if (Array.isArray(raw)) {
    return { sandbox_id: sandboxId, logs: raw.map((line) => String(line)) };
  }

  const obj = asRecord(raw);
  if (!obj) return { sandbox_id: sandboxId, logs: [] };

  if (Array.isArray(obj.logs)) {
    return { sandbox_id: sandboxId, logs: obj.logs.map((line) => String(line)) };
  }

  if (Array.isArray(obj.items)) {
    return {
      sandbox_id: sandboxId,
      logs: obj.items.map((line) => String(line)),
    };
  }

  return { sandbox_id: sandboxId, logs: [] };
}

export const sandboxesApi = {
  list: async () => {
    const res = await api.get<Sandbox[] | { sandboxes?: unknown[]; items?: unknown[] }>('/sandboxes');

    const rows = Array.isArray(res)
      ? res
      : Array.isArray(res.sandboxes)
        ? res.sandboxes
        : Array.isArray(res.items)
          ? res.items
          : [];

    return rows
      .map((row) => normalizeSandbox(row))
      .filter((row): row is Sandbox => row !== null);
  },

  stop: (sandboxId: string) => api.post<void>(`/sandboxes/${sandboxId}/stop`),

  logs: async (sandboxId: string, service?: string) => {
    const qs = service ? `?service=${encodeURIComponent(service)}` : '';
    const res = await api.get<SandboxLogs | { logs?: string[] } | string[]>(
      `/sandboxes/${sandboxId}/logs${qs}`,
    );

    return normalizeSandboxLogs(sandboxId, res);
  },
};
