<template>
  <div class="panel">
    <PanelHeader title="Log Console" icon="pi pi-list" :live="logs.entries.length > 0">
      <template #actions>
        <div class="log-filters">
          <input
            v-model="textFilter"
            class="log-filters__input"
            placeholder="Filter..."
            @input="applyFilters"
          />
          <select v-model="eventFilter" class="log-filters__select" @change="applyFilters">
            <option value="">All events</option>
            <option v-for="evt in eventTypes" :key="evt" :value="evt">{{ evt }}</option>
          </select>
          <select v-model="roleFilter" class="log-filters__select" @change="applyFilters">
            <option value="">All roles</option>
            <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
          </select>
          <button class="log-filters__btn" @click="logs.clearLogs()" title="Clear logs">
            <i class="pi pi-trash"></i>
          </button>
        </div>
      </template>
    </PanelHeader>
    <div class="panel__body panel__body--no-pad">
      <div class="log-console" ref="consoleRef" v-if="filteredEntries.length > 0">
        <div class="log-columns font-mono text-muted">
          <span>Time</span>
          <span>Event</span>
          <span>Role</span>
          <span>Model</span>
          <span>Card</span>
          <span>Tokens</span>
          <span>Duration</span>
          <span>Summary</span>
        </div>

        <div
          v-for="(entry, i) in filteredEntries"
          :key="i"
          class="log-entry"
          :class="`log-entry--${entry.event}`"
          @click="openDetails(entry)"
        >
          <span class="log-entry__time font-mono">{{ formatTime(entry.timestamp) }}</span>
          <span class="log-entry__event font-mono" :style="{ color: eventColor(entry.event) }">{{ entry.event }}</span>
          <span class="log-entry__role font-mono">{{ entry.role || '-' }}</span>
          <span class="log-entry__model font-mono text-muted">{{ entry.selected_model || '-' }}</span>
          <button
            v-if="entry.issue_id"
            class="log-entry__issue-btn font-mono"
            @click.stop="openCardById(entry.issue_id)"
            :title="`Open card ${entry.issue_id}`"
          >
            {{ entry.issue_id }}
          </button>
          <span v-else class="log-entry__issue font-mono text-muted">-</span>
          <span class="log-entry__tokens font-mono text-muted">
            {{ entry.tokens ? `${formatTokens(entry.tokens)}tok` : '-' }}
          </span>
          <span class="log-entry__duration font-mono text-muted">
            {{ entry.duration_ms ? formatDuration(entry.duration_ms) : '-' }}
          </span>
          <span class="log-entry__summary text-muted">{{ summarizeEntry(entry) }}</span>
        </div>
      </div>
      <EmptyState v-else message="No log entries" icon="pi pi-list" />
    </div>
  </div>

  <Dialog
    v-model:visible="detailVisible"
    modal
    header="Event Details"
    class="log-detail-dialog"
    :style="{ width: 'min(980px, 95vw)' }"
    :contentStyle="{ maxHeight: '75vh', overflow: 'auto' }"
  >
    <div v-if="selectedEntry" class="log-detail">
      <div class="log-detail__meta">
        <div><strong>Event:</strong> {{ selectedEntry.event }}</div>
        <div><strong>Time:</strong> {{ selectedEntry.timestamp }}</div>
        <div v-if="selectedEntry.role"><strong>Role:</strong> {{ selectedEntry.role }}</div>
        <div v-if="selectedEntry.session_id"><strong>Session:</strong> {{ selectedEntry.session_id }}</div>
        <div v-if="selectedEntry.issue_id">
          <strong>Issue:</strong>
          <button class="log-detail__card-btn font-mono" @click="openCardById(selectedEntry.issue_id)">
            {{ selectedEntry.issue_id }}
          </button>
        </div>
      </div>

      <div v-if="toolName" class="log-detail__section">
        <h4 class="log-detail__title">Tool Call</h4>
        <div class="log-detail__label">{{ toolName }}</div>
      </div>

      <div v-if="toolInput" class="log-detail__section">
        <h4 class="log-detail__title">Tool Input</h4>
        <pre class="log-detail__pre">{{ toPretty(toolInput) }}</pre>
      </div>

      <div v-if="toolOutput" class="log-detail__section">
        <h4 class="log-detail__title">Tool Output</h4>
        <pre class="log-detail__pre">{{ toPretty(toolOutput) }}</pre>
      </div>

      <div v-if="requirementsPayload" class="log-detail__section">
        <h4 class="log-detail__title">Requirements / Policy Context</h4>
        <pre class="log-detail__pre">{{ toPretty(requirementsPayload) }}</pre>
      </div>

      <div class="log-detail__section">
        <h4 class="log-detail__title">Raw Event Record</h4>
        <pre class="log-detail__pre">{{ toPretty(selectedEntry) }}</pre>
      </div>
    </div>
  </Dialog>

  <CardDetailDrawer v-model:visible="cardDrawerVisible" />
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import Dialog from 'primevue/dialog';
import PanelHeader from '@/layout/PanelHeader.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
import { useLogsStore } from '@/stores/logs.store';
import { useCardsStore } from '@/stores/cards.store';
import CardDetailDrawer from '@/components/cards/CardDetailDrawer.vue';
import { formatTime, formatTokens, formatDuration } from '@/utils/formatters';
import type { LogEntry } from '@/api/logs.api';

const logs = useLogsStore();
const cards = useCardsStore();
const consoleRef = ref<HTMLElement | null>(null);
const textFilter = ref('');
const eventFilter = ref('');
const roleFilter = ref('');
const detailVisible = ref(false);
const selectedEntry = ref<LogEntry | null>(null);
const cardDrawerVisible = ref(false);

const eventTypes = [
  'session_start', 'session_end', 'turn_start', 'turn_complete',
  'turn_failed', 'runtime_verifier_completed', 'guard_retry_scheduled', 'guard_terminal_failure',
];

const roles = computed(() => {
  const set = new Set(logs.entries.map((e) => e.role).filter(Boolean) as string[]);
  return [...set].sort();
});

const filteredEntries = computed(() => {
  let entries = logs.entries;
  if (eventFilter.value) {
    entries = entries.filter((e) => e.event === eventFilter.value);
  }
  if (roleFilter.value) {
    entries = entries.filter((e) => e.role === roleFilter.value);
  }
  if (textFilter.value) {
    const lower = textFilter.value.toLowerCase();
    entries = entries.filter(
      (e) =>
        e.event.toLowerCase().includes(lower) ||
        e.role?.toLowerCase().includes(lower) ||
        e.issue_id?.toLowerCase().includes(lower) ||
        e.selected_model?.toLowerCase().includes(lower),
    );
  }
  return entries;
});

const selectedData = computed(() => asRecord(selectedEntry.value?.data));
const runtimeEventData = computed(() => asRecord(selectedData.value?.runtime_event));

const toolName = computed(() => {
  return asString(selectedData.value?.tool) || asString(selectedData.value?.tool_name);
});

const toolInput = computed(() => {
  return selectedData.value?.args ?? selectedData.value?.tool_args;
});

const toolOutput = computed(() => {
  return selectedData.value?.result ?? selectedData.value?.tool_result ?? selectedData.value?.error;
});

const requirementsPayload = computed(() => {
  const candidates = {
    requirements: selectedData.value?.requirements,
    guard_contract: selectedData.value?.guard_contract,
    runtime_event: runtimeEventData.value,
    policy_scope: selectedData.value?.scope,
    violations: selectedData.value?.violations,
  };

  const filtered = Object.fromEntries(
    Object.entries(candidates).filter(([, value]) => value !== undefined && value !== null),
  );

  return Object.keys(filtered).length > 0 ? filtered : null;
});

function eventColor(event: string): string {
  switch (event) {
    case 'turn_complete': return 'var(--orket-accent-green)';
    case 'turn_failed':
    case 'guard_terminal_failure': return 'var(--orket-accent-red)';
    case 'turn_start':
    case 'session_start': return 'var(--orket-accent-cyan)';
    case 'guard_retry_scheduled': return 'var(--orket-accent-amber)';
    case 'runtime_verifier_completed': return 'var(--orket-accent-purple)';
    default: return 'var(--orket-text-secondary)';
  }
}

function openDetails(entry: LogEntry) {
  selectedEntry.value = entry;
  detailVisible.value = true;
}

async function openCardById(cardId?: string) {
  if (!cardId) return;
  try {
    await cards.selectCard(cardId);
    cardDrawerVisible.value = true;
  } catch {
    // Keep the log UX responsive even if card lookup fails.
  }
}

function summarizeEntry(entry: LogEntry): string {
  const data = asRecord(entry.data);
  if (!data) return '';

  const direct = asString(data.message) || asString(data.reason) || asString(data.error);
  if (direct) return direct;

  const runtime = asRecord(data.runtime_event);
  const runtimeMsg =
    asString(runtime?.terminal_reason) ||
    asString(asRecord(runtime?.terminal_reason)?.message);

  return runtimeMsg || '';
}

function toPretty(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function applyFilters() {
  if (eventFilter.value || roleFilter.value) {
    logs.setFilters({
      event: eventFilter.value || undefined,
      role: roleFilter.value || undefined,
    });
  }
}

// Auto-scroll to bottom on new entries
watch(
  () => logs.entries.length,
  async () => {
    await nextTick();
    if (consoleRef.value) {
      consoleRef.value.scrollTop = consoleRef.value.scrollHeight;
    }
  },
);
</script>

<style scoped>
.log-filters {
  display: flex;
  align-items: center;
  gap: var(--orket-space-sm);
}

.log-filters__input {
  width: 100px;
  padding: 2px 6px;
  background: var(--orket-bg-surface);
  border: 1px solid var(--orket-border);
  border-radius: var(--orket-radius-sm);
  color: var(--orket-text-secondary);
  font-size: var(--orket-font-size-xs);
  font-family: var(--orket-font-mono);
}

.log-filters__select {
  padding: 2px 6px;
  background: var(--orket-bg-surface);
  border: 1px solid var(--orket-border);
  border-radius: var(--orket-radius-sm);
  color: var(--orket-text-secondary);
  font-size: var(--orket-font-size-xs);
  font-family: var(--orket-font-mono);
}

.log-filters__btn {
  padding: 2px 6px;
  background: transparent;
  border: 1px solid var(--orket-border);
  border-radius: var(--orket-radius-sm);
  color: var(--orket-text-muted);
  cursor: pointer;
  font-size: var(--orket-font-size-xs);
}

.log-filters__btn:hover {
  color: var(--orket-accent-red);
  border-color: var(--orket-accent-red);
}

.log-console {
  height: 100%;
  overflow-y: auto;
  padding: 0;
}

.log-columns {
  display: grid;
  grid-template-columns: 74px 180px 88px 180px 112px 78px 88px minmax(220px, 1fr);
  gap: var(--orket-space-sm);
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 6px var(--orket-space-sm);
  border-bottom: 1px solid var(--orket-border);
  background: var(--orket-bg-surface);
  font-size: 10px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.log-entry {
  display: grid;
  grid-template-columns: 74px 180px 88px 180px 112px 78px 88px minmax(220px, 1fr);
  gap: var(--orket-space-sm);
  align-items: center;
  padding: 4px var(--orket-space-sm);
  font-size: var(--orket-font-size-xs);
  line-height: 1.4;
  border-bottom: 1px solid rgba(42, 50, 69, 0.3);
  cursor: pointer;
}

.log-entry:hover {
  background: var(--orket-bg-elevated);
}

.log-entry__time {
  color: var(--orket-text-muted);
  min-width: 65px;
  flex-shrink: 0;
}

.log-entry__event {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-entry__role {
  color: var(--orket-accent-cyan);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-entry__model,
.log-entry__issue,
.log-entry__tokens,
.log-entry__duration {
  font-size: var(--orket-font-size-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-entry__summary {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-entry__issue-btn {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--orket-accent-cyan);
  text-align: left;
  cursor: pointer;
  text-decoration: underline dotted;
}

.log-entry__issue-btn:hover {
  color: var(--orket-text-primary);
}

.log-detail {
  display: flex;
  flex-direction: column;
  gap: var(--orket-space-md);
}

.log-detail__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--orket-space-sm) var(--orket-space-md);
  font-size: var(--orket-font-size-xs);
}

.log-detail__section {
  border: 1px solid var(--orket-border);
  border-radius: var(--orket-radius-sm);
  padding: var(--orket-space-sm);
  background: var(--orket-bg-surface);
}

.log-detail__title {
  margin: 0 0 var(--orket-space-xs) 0;
  font-size: var(--orket-font-size-sm);
  color: var(--orket-text-primary);
}

.log-detail__label {
  font-family: var(--orket-font-mono);
  font-size: var(--orket-font-size-xs);
  color: var(--orket-accent-cyan);
}

.log-detail__card-btn {
  margin-left: var(--orket-space-sm);
  padding: 2px 6px;
  border: 1px solid var(--orket-border-active);
  border-radius: var(--orket-radius-sm);
  background: var(--orket-bg-surface);
  color: var(--orket-accent-cyan);
  cursor: pointer;
}

.log-detail__card-btn:hover {
  background: var(--orket-bg-elevated);
}

.log-detail__pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--orket-font-mono);
  font-size: var(--orket-font-size-xs);
  color: var(--orket-text-secondary);
}

:deep(.log-detail-dialog.p-dialog) {
  background: var(--orket-bg-panel) !important;
  border: 1px solid var(--orket-border) !important;
  color: var(--orket-text-primary) !important;
  box-shadow: 0 0 0 1px var(--orket-border), 0 24px 56px rgba(0, 0, 0, 0.62) !important;
  outline: none;
}

:deep(.log-detail-dialog.p-dialog::before),
:deep(.log-detail-dialog.p-dialog::after) {
  display: none;
}

:deep(.log-detail-dialog .p-dialog-header) {
  background: var(--orket-bg-surface) !important;
  border-bottom: 1px solid var(--orket-border) !important;
  color: var(--orket-text-primary) !important;
}

:deep(.log-detail-dialog .p-dialog-title) {
  color: var(--orket-text-primary) !important;
  font-family: var(--orket-font-display);
  letter-spacing: 0.03em;
}

:deep(.log-detail-dialog .p-dialog-content) {
  background: var(--orket-bg-panel) !important;
  color: var(--orket-text-secondary) !important;
}

:deep(.log-detail-dialog .p-dialog-footer) {
  background: var(--orket-bg-panel) !important;
  border-top: 1px solid var(--orket-border) !important;
}

:deep(.log-detail-dialog .p-dialog-header-icon) {
  color: var(--orket-text-muted) !important;
}

:deep(.log-detail-dialog .p-dialog-header-icon:hover) {
  color: var(--orket-text-primary) !important;
  background: var(--orket-bg-elevated) !important;
}

:deep(.p-dialog-mask:has(.log-detail-dialog)) {
  background: rgba(0, 0, 0, 0.7) !important;
}
  .panel {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
</style>
