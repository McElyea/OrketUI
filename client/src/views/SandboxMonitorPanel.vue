<template>
  <div class="panel">
    <PanelHeader title="Sandboxes" icon="pi pi-box" :live="runningCount > 0" />
    <div class="panel__body panel__body--no-pad">
      <div class="sandbox-list" v-if="sandboxes.sandboxes.length > 0">
        <div
          v-for="sb in sandboxes.sandboxes"
          :key="sb.sandbox_id"
          class="sandbox-card"
          :class="`sandbox-card--${sb.status}`"
        >
          <div class="sandbox-card__header">
            <span class="sandbox-card__dot" :class="`sandbox-card__dot--${sb.status}`"></span>
            <span class="sandbox-card__id font-mono">{{ sb.sandbox_id.slice(0, 12) }}</span>
            <span class="sandbox-card__spacer"></span>
            <button
              v-if="sb.status === 'running'"
              class="sandbox-card__stop"
              @click="sandboxes.stopSandbox(sb.sandbox_id)"
              title="Stop sandbox"
            >
              <i class="pi pi-stop"></i>
            </button>
            <button
              class="sandbox-card__log-btn"
              :class="{ 'sandbox-card__log-btn--active': expandedId === sb.sandbox_id }"
              @click="toggleLogs(sb.sandbox_id)"
              title="View logs"
            >
              <i class="pi pi-file"></i>
            </button>
          </div>
          <div class="sandbox-card__meta text-xs">
            <span v-if="sb.service" class="text-cyan">{{ sb.service }}</span>
            <span v-if="sb.issue_id" class="text-muted font-mono">{{ sb.issue_id }}</span>
            <span class="text-muted">{{ formatTimeAgo(sb.created_at) }}</span>
          </div>
          <div v-if="expandedId === sb.sandbox_id" class="sandbox-card__logs">
            <template v-if="sandboxes.loading">
              <span class="text-muted text-xs">Loading logs...</span>
            </template>
            <template v-else-if="sandboxes.selectedLogs?.logs?.length">
              <pre class="sandbox-card__logs-pre font-mono">{{ sandboxes.selectedLogs.logs.join('\n') }}</pre>
            </template>
            <template v-else>
              <span class="text-muted text-xs">No logs available</span>
            </template>
          </div>
        </div>
      </div>
      <EmptyState v-else message="No sandboxes" icon="pi pi-box" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import PanelHeader from '@/layout/PanelHeader.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
import { useSandboxesStore } from '@/stores/sandboxes.store';
import { formatTimeAgo } from '@/utils/formatters';

const sandboxes = useSandboxesStore();
const expandedId = ref<string | null>(null);

const runningCount = computed(() =>
  sandboxes.sandboxes.filter((s) => s.status === 'running').length,
);

async function toggleLogs(sandboxId: string) {
  if (expandedId.value === sandboxId) {
    expandedId.value = null;
  } else {
    expandedId.value = sandboxId;
    await sandboxes.fetchLogs(sandboxId);
  }
}
</script>

<style scoped>
.sandbox-list {
  height: 100%;
  overflow-y: auto;
  padding: var(--orket-space-sm);
  display: flex;
  flex-direction: column;
  gap: var(--orket-space-sm);
}

.sandbox-card {
  background: var(--orket-bg-surface);
  border: 1px solid var(--orket-border);
  border-radius: var(--orket-radius-sm);
  padding: var(--orket-space-sm) var(--orket-space-md);
}

.sandbox-card--running {
  border-left: 3px solid var(--orket-accent-green);
}

.sandbox-card--stopped {
  border-left: 3px solid var(--orket-text-muted);
  opacity: 0.6;
}

.sandbox-card__header {
  display: flex;
  align-items: center;
  gap: var(--orket-space-sm);
  margin-bottom: var(--orket-space-xs);
}

.sandbox-card__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sandbox-card__dot--running {
  background: var(--orket-accent-green);
  box-shadow: var(--orket-glow-green);
}

.sandbox-card__dot--stopped {
  background: var(--orket-text-muted);
}

.sandbox-card__id {
  font-size: var(--orket-font-size-xs);
  color: var(--orket-text-primary);
}

.sandbox-card__spacer {
  flex: 1;
}

.sandbox-card__stop,
.sandbox-card__log-btn {
  background: transparent;
  border: 1px solid var(--orket-border);
  border-radius: var(--orket-radius-sm);
  color: var(--orket-text-muted);
  cursor: pointer;
  padding: 2px 4px;
  font-size: 10px;
  transition: all var(--orket-transition-fast);
}

.sandbox-card__stop:hover {
  color: var(--orket-accent-red);
  border-color: var(--orket-accent-red);
}

.sandbox-card__log-btn:hover,
.sandbox-card__log-btn--active {
  color: var(--orket-accent-cyan);
  border-color: var(--orket-accent-cyan);
}

.sandbox-card__meta {
  display: flex;
  gap: var(--orket-space-md);
}

.sandbox-card__logs {
  margin-top: var(--orket-space-sm);
  border-top: 1px solid var(--orket-border);
  padding-top: var(--orket-space-sm);
  max-height: 120px;
  overflow-y: auto;
}

.sandbox-card__logs-pre {
  margin: 0;
  font-size: 10px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--orket-text-secondary);
}
</style>
