import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "./client";
import type {
  CardDetailResponse,
  CardsResponse,
  FlowDetailResponse,
  FlowsResponse,
  MetaResponse,
  PromptReforgerContextResponse,
  RunDetailResponse,
  RunsResponse,
  SystemOverviewResponse,
} from "./types";

export function useMetaQuery() {
  return useQuery({
    queryKey: ["meta"],
    queryFn: () => fetchJson<MetaResponse>("/api/meta"),
  });
}

export function useSystemOverviewQuery() {
  return useQuery({
    queryKey: ["system-overview"],
    queryFn: () => fetchJson<SystemOverviewResponse>("/api/system/overview"),
  });
}

export function useCardsQuery(limit = 12, filterToken?: string) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (filterToken) {
    params.set("filter", filterToken);
  }
  return useQuery({
    queryKey: ["cards", limit, filterToken ?? ""],
    queryFn: () => fetchJson<CardsResponse>(`/api/cards?${params.toString()}`),
  });
}

export function useCardDetailQuery(cardId?: string) {
  return useQuery({
    queryKey: ["card-detail", cardId ?? ""],
    queryFn: () => fetchJson<CardDetailResponse>(`/api/cards/${cardId}`),
    enabled: Boolean(cardId),
  });
}

export function useRunsQuery(limit = 12) {
  return useQuery({
    queryKey: ["runs", limit],
    queryFn: () => fetchJson<RunsResponse>(`/api/runs?limit=${limit}`),
  });
}

export function useFlowsQuery(limit = 25, offset = 0) {
  return useQuery({
    queryKey: ["flows", limit, offset],
    queryFn: () => fetchJson<FlowsResponse>(`/api/flows?limit=${limit}&offset=${offset}`),
  });
}

export function useFlowDetailQuery(flowId?: string) {
  return useQuery({
    queryKey: ["flow-detail", flowId ?? ""],
    queryFn: () => fetchJson<FlowDetailResponse>(`/api/flows/${flowId}`),
    enabled: Boolean(flowId),
  });
}

export function useRunDetailQuery(sessionId?: string) {
  return useQuery({
    queryKey: ["run-detail", sessionId ?? ""],
    queryFn: () => fetchJson<RunDetailResponse>(`/api/runs/${sessionId}`),
    enabled: Boolean(sessionId),
  });
}

export function usePromptReforgerContextQuery(cardId?: string) {
  const params = new URLSearchParams();
  if (cardId) {
    params.set("card_id", cardId);
  }
  const query = params.toString();
  return useQuery({
    queryKey: ["prompt-reforger-context", cardId ?? ""],
    queryFn: () =>
      fetchJson<PromptReforgerContextResponse>(
        query ? `/api/prompt-reforger/context?${query}` : "/api/prompt-reforger/context",
      ),
  });
}
