import { api } from './client';
import type {
  HealthResponse,
  VersionResponse,
  HeartbeatResponse,
  HardwareMetrics,
  Board,
  RuntimePolicy,
  RuntimePolicyOptions,
  CalendarResponse,
} from '@/types/system';
import type { ChatDriverResponse, RunActiveRequest } from '@/types/settings';

export const systemApi = {
  health: () => api.get<HealthResponse>('/health'),

  version: () => api.get<VersionResponse>('/version'),

  heartbeat: () => api.get<HeartbeatResponse>('/system/heartbeat'),

  metrics: () => api.get<HardwareMetrics>('/system/metrics'),

  board: () => api.get<Board | { board?: Board }>('/system/board').then((res) => {
    if ('board' in res && res.board) return res.board;
    return res as Board;
  }),

  runtimePolicyOptions: () => api.get<RuntimePolicyOptions>('/system/runtime-policy/options'),

  runtimePolicy: () => api.get<RuntimePolicy>('/system/runtime-policy'),

  updateRuntimePolicy: (policy: Partial<RuntimePolicy>) =>
    api.post<RuntimePolicy>('/system/runtime-policy', policy),

  calendar: () => api.get<CalendarResponse>('/system/calendar'),

  explorer: (path?: string) =>
    api.get<unknown>(`/system/explorer${path ? `?path=${encodeURIComponent(path)}` : ''}`),

  readFile: (path: string) =>
    api.get<string>(`/system/read?path=${encodeURIComponent(path)}`),

  saveFile: (path: string, content: string) =>
    api.post<void>('/system/save', { path, content }),

  previewAsset: (path: string) =>
    api.get<unknown>(`/system/preview-asset?path=${encodeURIComponent(path)}`),

  chatDriver: async (message: string) => {
    const response = await api.post<ChatDriverResponse | { message?: string } | string>(
      '/system/chat-driver',
      { message },
      { timeoutMs: 20000 },
    );

    if (typeof response === 'string') {
      return { response };
    }

    if ('response' in response && typeof response.response === 'string') {
      return { response: response.response };
    }

    if ('message' in response && typeof response.message === 'string') {
      return { response: response.message };
    }

    return { response: JSON.stringify(response, null, 2) };
  },

  runActive: (params?: RunActiveRequest) =>
    api.post<unknown>('/system/run-active', params),

  clearLogs: () => api.post<void>('/system/clear-logs'),
};
