import { defineStore } from 'pinia';
import { ref } from 'vue';
import { settingsApi } from '@/api/settings.api';
import type { RuntimePolicy, RuntimePolicyOptions } from '@/types/system';
import type { SettingsResponse } from '@/types/settings';

export const useSettingsStore = defineStore('settings', () => {
  const policy = ref<RuntimePolicy>({});
  const policyOptions = ref<RuntimePolicyOptions>({});
  const settings = ref<SettingsResponse>({});
  const loading = ref(false);

  async function fetchAll() {
    loading.value = true;
    try {
      const [opts, pol, sett] = await Promise.all([
        settingsApi.getRuntimePolicyOptions(),
        settingsApi.getRuntimePolicy(),
        settingsApi.getSettings(),
      ]);
      policyOptions.value = opts;
      policy.value = pol;
      settings.value = sett;
    } catch {
      // Handle error
    } finally {
      loading.value = false;
    }
  }

  async function updatePolicy(updates: Partial<RuntimePolicy>) {
    const result = await settingsApi.updateRuntimePolicy(updates);
    policy.value = result;
  }

  async function updateSettings(updates: Record<string, unknown>) {
    const result = await settingsApi.updateSettings(updates);
    settings.value = result;
  }

  return { policy, policyOptions, settings, loading, fetchAll, updatePolicy, updateSettings };
});
