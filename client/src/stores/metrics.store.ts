import { defineStore } from 'pinia';
import { ref } from 'vue';
import { systemApi } from '@/api/system.api';
import type { HardwareMetrics, HeartbeatResponse } from '@/types/system';
import { METRICS_HISTORY_LENGTH } from '@/utils/constants';

export interface MetricsDataPoint {
  timestamp: number;
  cpu: number;
  ram: number;
  vram_used: number;
  vram_total: number;
}

export interface TokenDataPoint {
  timestamp: number;
  tokensPerSec: number;
}

export const useMetricsStore = defineStore('metrics', () => {
  const current = ref<HardwareMetrics | null>(null);
  const heartbeat = ref<HeartbeatResponse>({ active_task_count: 0 });
  const history = ref<MetricsDataPoint[]>([]);
  const tokenHistory = ref<TokenDataPoint[]>([]);

  async function fetchMetrics() {
    try {
      const metrics = await systemApi.metrics();
      current.value = metrics;

      // Append to history, maintain ring buffer
      history.value.push({
        timestamp: Date.now(),
        cpu: metrics.cpu_percent,
        ram: metrics.ram_percent,
        vram_used: metrics.vram_gb_used,
        vram_total: metrics.vram_total_gb,
      });
      if (history.value.length > METRICS_HISTORY_LENGTH) {
        history.value = history.value.slice(-METRICS_HISTORY_LENGTH);
      }
    } catch {
      // Silently fail
    }
  }

  async function fetchHeartbeat() {
    try {
      const raw = await systemApi.heartbeat() as HeartbeatResponse & { active_tasks?: number };
      heartbeat.value = {
        ...raw,
        active_task_count: raw.active_task_count ?? raw.active_tasks ?? 0,
      };
    } catch {
      // Silently fail
    }
  }

  /** Called from WS events to track token throughput */
  function recordTokens(tokens: number, durationMs: number) {
    if (durationMs <= 0 || tokens <= 0) return;
    const tokensPerSec = (tokens / durationMs) * 1000;
    tokenHistory.value.push({
      timestamp: Date.now(),
      tokensPerSec,
    });
    if (tokenHistory.value.length > METRICS_HISTORY_LENGTH) {
      tokenHistory.value = tokenHistory.value.slice(-METRICS_HISTORY_LENGTH);
    }
  }

  return {
    current,
    heartbeat,
    history,
    tokenHistory,
    fetchMetrics,
    fetchHeartbeat,
    recordTokens,
  };
});
