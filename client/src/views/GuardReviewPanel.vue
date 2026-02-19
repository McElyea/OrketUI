<template>
  <div class="panel">
    <PanelHeader title="Guard Review" icon="pi pi-shield" :live="events.guardEvents.length > 0" />
    <div class="panel__body panel__body--no-pad">
      <div class="guard-feed" v-if="events.guardEvents.length > 0">
        <div
          v-for="(evt, i) in reversedEvents"
          :key="i"
          class="guard-card"
          :class="`guard-card--${actionClass(evt)}`"
        >
          <div class="guard-card__header">
            <span class="guard-card__badge" :style="{ background: actionColor(evt) }">
              {{ actionLabel(evt) }}
            </span>
            <span class="guard-card__time text-muted font-mono">{{ formatTime(evt.timestamp) }}</span>
          </div>
          <div class="guard-card__meta font-mono text-xs">
            <span v-if="evt.role" class="text-cyan">{{ evt.role }}</span>
            <span v-if="evt.issue_id" class="text-muted">{{ evt.issue_id }}</span>
            <span v-if="evt.turn_index !== undefined" class="text-muted">T{{ evt.turn_index }}</span>
          </div>
          <template v-if="evt.guard_decision">
            <div v-if="evt.guard_decision.terminal_reason" class="guard-card__reason text-xs">
              {{ evt.guard_decision.terminal_reason.message }}
            </div>
            <div v-if="evt.guard_decision.next_retry_count > 0" class="guard-card__retry text-xs text-muted font-mono">
              Retry #{{ evt.guard_decision.next_retry_count }}
              <span v-if="evt.guard_decision.repeated_fingerprint" class="text-amber"> (repeated)</span>
            </div>
          </template>
          <template v-if="evt.guard_contract">
            <div
              v-for="(v, vi) in contractViolations(evt)"
              :key="vi"
              class="guard-card__violation text-xs"
            >
              <i class="pi pi-exclamation-triangle" style="font-size: 10px"></i>
              {{ violationMessage(v) }}
            </div>
          </template>
        </div>
      </div>
      <EmptyState v-else message="No guard decisions" icon="pi pi-shield" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PanelHeader from '@/layout/PanelHeader.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
import { useEventsStore } from '@/stores/events.store';
import { formatTime } from '@/utils/formatters';
import type { RuntimeEvent } from '@/types/websocket';

const events = useEventsStore();

const reversedEvents = computed(() => [...events.guardEvents].reverse());

function actionClass(evt: RuntimeEvent): string {
  switch (evt.event) {
    case 'runtime_verifier_completed':
      return evt.guard_decision?.action === 'pass' ? 'pass' : 'retry';
    case 'guard_retry_scheduled': return 'retry';
    case 'guard_terminal_failure': return 'fail';
    default: return 'pass';
  }
}

function actionColor(evt: RuntimeEvent): string {
  switch (actionClass(evt)) {
    case 'pass': return 'var(--orket-accent-green)';
    case 'retry': return 'var(--orket-accent-amber)';
    case 'fail': return 'var(--orket-accent-red)';
    default: return 'var(--orket-text-muted)';
  }
}

function actionLabel(evt: RuntimeEvent): string {
  switch (actionClass(evt)) {
    case 'pass': return 'PASS';
    case 'retry': return 'RETRY';
    case 'fail': return 'FAIL';
    default: return evt.event;
  }
}

function contractViolations(evt: RuntimeEvent): unknown[] {
  const contract = evt.guard_contract as Record<string, unknown> | undefined;
  if (!contract) return [];
  return Array.isArray(contract.violations) ? contract.violations : [];
}

function violationMessage(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && 'message' in v) {
    const msg = (v as { message?: unknown }).message;
    return typeof msg === 'string' ? msg : 'Violation';
  }
  return 'Violation';
}
</script>

<style scoped>
.guard-feed {
  height: 100%;
  overflow-y: auto;
  padding: var(--orket-space-sm);
  display: flex;
  flex-direction: column;
  gap: var(--orket-space-sm);
}

.guard-card {
  background: var(--orket-bg-surface);
  border: 1px solid var(--orket-border);
  border-radius: var(--orket-radius-sm);
  padding: var(--orket-space-sm) var(--orket-space-md);
}

.guard-card--pass {
  border-left: 3px solid var(--orket-accent-green);
}

.guard-card--retry {
  border-left: 3px solid var(--orket-accent-amber);
}

.guard-card--fail {
  border-left: 3px solid var(--orket-accent-red);
}

.guard-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--orket-space-xs);
}

.guard-card__badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: var(--orket-radius-sm);
  font-size: 9px;
  font-weight: 700;
  font-family: var(--orket-font-mono);
  color: var(--orket-bg-base);
  letter-spacing: 0.05em;
}

.guard-card__time {
  font-size: 9px;
}

.guard-card__meta {
  display: flex;
  gap: var(--orket-space-md);
  margin-bottom: var(--orket-space-xs);
}

.guard-card__reason {
  color: var(--orket-accent-red);
  margin-top: var(--orket-space-xs);
}

.guard-card__retry {
  margin-top: var(--orket-space-xs);
}

.guard-card__violation {
  display: flex;
  align-items: center;
  gap: var(--orket-space-sm);
  color: var(--orket-accent-amber);
  margin-top: 2px;
}
</style>
