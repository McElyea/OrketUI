import { api } from './client';
import type { Card, CardHistory, CardComment } from '@/types/cards';
import type { ArchiveCardsRequest } from '@/types/settings';

export interface CardListFilters {
  build_id?: string;
  session_id?: string;
  status?: string;
}

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as AnyRecord;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function normalizeCardHistory(cardId: string, raw: unknown): CardHistory {
  const payload = asRecord(raw);
  const maybeTransitions = payload?.transitions;
  const maybeHistory = payload?.history;

  if (Array.isArray(maybeTransitions)) {
    return {
      card_id: asString(payload?.card_id) || cardId,
      transitions: maybeTransitions as CardHistory['transitions'],
    };
  }

  if (Array.isArray(maybeHistory)) {
    const transitions = maybeHistory
      .map((entry) => asRecord(entry))
      .filter((entry): entry is AnyRecord => entry !== null)
      .map((entry) => ({
        from_status: asString(entry.from_status) || 'ready',
        to_status: asString(entry.to_status) || 'ready',
        timestamp: asString(entry.timestamp) || new Date().toISOString(),
        reason: asString(entry.reason),
        actor: asString(entry.actor),
      })) as CardHistory['transitions'];

    return {
      card_id: asString(payload?.card_id) || cardId,
      transitions,
    };
  }

  return { card_id: cardId, transitions: [] };
}

export const cardsApi = {
  list: async (filters?: CardListFilters) => {
    const params = new URLSearchParams();
    if (filters?.build_id) params.set('build_id', filters.build_id);
    if (filters?.session_id) params.set('session_id', filters.session_id);
    if (filters?.status) params.set('status', filters.status);
    const qs = params.toString();
    const res = await api.get<Card[] | { items?: Card[] }>(`/cards${qs ? `?${qs}` : ''}`);
    return Array.isArray(res) ? res : Array.isArray(res.items) ? res.items : [];
  },

  get: (cardId: string) => api.get<Card>(`/cards/${cardId}`),

  history: async (cardId: string) => {
    const res = await api.get<CardHistory | { card_id?: string; history?: unknown[]; transitions?: unknown[] }>(
      `/cards/${cardId}/history`,
    );
    return normalizeCardHistory(cardId, res);
  },

  comments: async (cardId: string) => {
    const res = await api.get<CardComment[] | { card_id?: string; comments?: CardComment[] }>(
      `/cards/${cardId}/comments`,
    );
    return Array.isArray(res) ? res : Array.isArray(res.comments) ? res.comments : [];
  },

  archive: (request: ArchiveCardsRequest) => api.post<void>('/cards/archive', request),
};
