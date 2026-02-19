import { defineStore } from 'pinia';
import { ref } from 'vue';
import { sandboxesApi } from '@/api/sandboxes.api';
import type { Sandbox, SandboxLogs } from '@/types/settings';

export const useSandboxesStore = defineStore('sandboxes', () => {
  const sandboxes = ref<Sandbox[]>([]);
  const selectedLogs = ref<SandboxLogs | null>(null);
  const loading = ref(false);

  async function fetchSandboxes() {
    try {
      sandboxes.value = await sandboxesApi.list();
    } catch {
      // Silently fail
    }
  }

  async function stopSandbox(sandboxId: string) {
    await sandboxesApi.stop(sandboxId);
    await fetchSandboxes();
  }

  async function fetchLogs(sandboxId: string) {
    loading.value = true;
    try {
      selectedLogs.value = await sandboxesApi.logs(sandboxId);
    } catch {
      selectedLogs.value = null;
    } finally {
      loading.value = false;
    }
  }

  return { sandboxes, selectedLogs, loading, fetchSandboxes, stopSandbox, fetchLogs };
});
