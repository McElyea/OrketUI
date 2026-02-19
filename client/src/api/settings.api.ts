import { api } from './client';
import type { RuntimePolicy, RuntimePolicyOptions } from '@/types/system';
import type { SettingsResponse } from '@/types/settings';

export const settingsApi = {
  getSettings: () => api.get<SettingsResponse>('/settings'),

  updateSettings: (updates: Record<string, unknown>) =>
    api.patch<SettingsResponse>('/settings', updates),

  getRuntimePolicyOptions: () => api.get<RuntimePolicyOptions>('/system/runtime-policy/options'),

  getRuntimePolicy: () => api.get<RuntimePolicy>('/system/runtime-policy'),

  updateRuntimePolicy: (policy: Partial<RuntimePolicy>) =>
    api.post<RuntimePolicy>('/system/runtime-policy', policy),
};
