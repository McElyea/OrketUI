import { defineStore } from 'pinia';
import { ref } from 'vue';
import { logsApi, type LogEntry, type LogQuery } from '@/api/logs.api';
import { LOG_BUFFER_SIZE, DEFAULT_LOG_LIMIT } from '@/utils/constants';

export const useLogsStore = defineStore('logs', () => {
  const entries = ref<LogEntry[]>([]);
  const filters = ref<LogQuery>({ limit: DEFAULT_LOG_LIMIT });
  const loading = ref(false);

  async function fetchLogs() {
    try {
      const logs = await logsApi.query(filters.value);
      // Merge new logs, avoiding duplicates by timestamp
      const existing = new Set(entries.value.map((e) => e.timestamp));
      const newEntries = logs.filter((l) => !existing.has(l.timestamp));
      entries.value = [...entries.value, ...newEntries].slice(-LOG_BUFFER_SIZE);
    } catch {
      // Silently fail
    }
  }

  async function loadInitial() {
    loading.value = true;
    try {
      entries.value = await logsApi.query({ ...filters.value, limit: DEFAULT_LOG_LIMIT });
    } catch {
      entries.value = [];
    } finally {
      loading.value = false;
    }
  }

  function setFilters(newFilters: Partial<LogQuery>) {
    filters.value = { ...filters.value, ...newFilters };
  }

  async function clearLogs() {
    await logsApi.clear();
    entries.value = [];
  }

  return { entries, filters, loading, fetchLogs, loadInitial, setFilters, clearLogs };
});
