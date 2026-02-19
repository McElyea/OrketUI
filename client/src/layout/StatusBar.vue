<template>
  <div class="statusbar">
    <div class="statusbar__item">
      <span class="statusbar__dot" :class="`statusbar__dot--${wsStatus}`"></span>
      WS: {{ wsStatus }}
    </div>
    <div class="statusbar__item">
      <i class="pi pi-bolt"></i>
      {{ metrics.heartbeat.active_task_count }} active tasks
    </div>
    <div class="statusbar__item" v-if="metrics.current">
      CPU {{ formatPercent(metrics.current.cpu_percent) }}
      &middot;
      RAM {{ formatPercent(metrics.current.ram_percent) }}
      &middot;
      VRAM {{ formatGB(metrics.current.vram_gb_used) }}/{{ formatGB(metrics.current.vram_total_gb) }}
    </div>
    <div class="statusbar__spacer"></div>
    <div class="statusbar__item">
      API: localhost:8082
    </div>
    <div class="statusbar__item font-mono">
      {{ clock }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useMetricsStore } from '@/stores/metrics.store';
import { formatPercent, formatGB } from '@/utils/formatters';

defineProps<{
  wsStatus: 'connecting' | 'connected' | 'disconnected';
}>();

const metrics = useMetricsStore();
const clock = ref('');
let clockTimer: ReturnType<typeof setInterval>;

function updateClock() {
  clock.value = new Date().toLocaleTimeString('en-US', { hour12: false });
}

onMounted(() => {
  updateClock();
  clockTimer = setInterval(updateClock, 1000);
});

onUnmounted(() => clearInterval(clockTimer));
</script>

<style scoped>
.statusbar {
  display: flex;
  align-items: center;
  height: 24px;
  min-height: 24px;
  max-height: 24px;
  padding: 0 var(--orket-space-lg);
  background: var(--orket-bg-surface);
  border-top: 1px solid var(--orket-border);
  font-size: var(--orket-font-size-xs);
  color: var(--orket-text-secondary);
  gap: var(--orket-space-xl);
  flex-shrink: 0;
  font-family: var(--orket-font-mono);
}

.statusbar__item {
  display: flex;
  align-items: center;
  gap: var(--orket-space-sm);
  white-space: nowrap;
  min-width: 0;
}

.statusbar__item:nth-child(1) {
  min-width: 120px;
}

.statusbar__item:nth-child(2) {
  min-width: 120px;
}

.statusbar__item:nth-child(3) {
  min-width: 280px;
}

.statusbar__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.statusbar__dot--connected { background: var(--orket-accent-green); box-shadow: var(--orket-glow-green); }
.statusbar__dot--connecting { background: var(--orket-accent-amber); }
.statusbar__dot--disconnected { background: var(--orket-accent-red); }

.statusbar__spacer {
  flex: 1;
}
</style>
