<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    header="Run History"
    modal
    :style="{ width: '700px', maxHeight: '80vh' }"
    :breakpoints="{ '768px': '95vw' }"
    :contentStyle="{ padding: 0 }"
  >
    <DataTable
      :value="session.runs"
      :loading="session.loading"
      selectionMode="single"
      @rowSelect="onRowSelect"
      scrollable
      scrollHeight="400px"
      :rowClass="rowClass"
      stripedRows
      class="history-table"
    >
      <Column field="session_id" header="Session" :style="{ width: '120px' }">
        <template #body="{ data }">
          <span class="font-mono text-xs">{{ shortId(data.session_id) }}</span>
        </template>
      </Column>
      <Column field="status" header="Status" :style="{ width: '100px' }">
        <template #body="{ data }">
          <span class="history-status" :class="`history-status--${data.status}`">
            {{ data.status }}
          </span>
        </template>
      </Column>
      <Column field="type" header="Type" :style="{ width: '90px' }">
        <template #body="{ data }">
          <span class="text-muted text-xs">{{ data.type || '—' }}</span>
        </template>
      </Column>
      <Column field="started_at" header="Started" :style="{ width: '130px' }">
        <template #body="{ data }">
          <span class="font-mono text-xs">{{ formatTime(data.started_at) }}</span>
        </template>
      </Column>
      <Column header="Duration" :style="{ width: '80px' }">
        <template #body="{ data }">
          <span class="font-mono text-xs">{{ computeDuration(data) }}</span>
        </template>
      </Column>
      <Column header="Issues" :style="{ width: '70px' }">
        <template #body="{ data }">
          <span class="font-mono text-xs">
            {{ data.summary ? `${data.summary.completed}/${data.summary.total_issues}` : '—' }}
          </span>
        </template>
      </Column>
    </DataTable>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useSessionStore } from '@/stores/session.store';
import { shortId, formatTime, formatDuration } from '@/utils/formatters';
import type { Run } from '@/types/sessions';

defineProps<{ visible: boolean }>();
const emit = defineEmits<{ 'update:visible': [value: boolean] }>();

const session = useSessionStore();

function computeDuration(run: Run): string {
  if (run.summary?.total_duration_ms) return formatDuration(run.summary.total_duration_ms);
  if (run.ended_at && run.started_at) {
    return formatDuration(new Date(run.ended_at).getTime() - new Date(run.started_at).getTime());
  }
  if (run.status === 'running') return 'running...';
  return '—';
}

function rowClass(data: Run) {
  return session.activeRun?.session_id === data.session_id ? 'history-row--active' : '';
}

async function onRowSelect(event: { data: Run }) {
  await session.loadRunIntoWall(event.data.session_id);
  emit('update:visible', false);
}
</script>

<style scoped>
.history-table {
  font-size: var(--orket-font-size-xs);
}

.history-status {
  font-family: var(--orket-font-mono);
  font-size: var(--orket-font-size-xs);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.history-status--running { color: var(--orket-accent-green); }
.history-status--completed { color: var(--orket-accent-cyan); }
.history-status--failed { color: var(--orket-accent-red); }
.history-status--halted { color: var(--orket-accent-amber); }
.history-status--idle { color: var(--orket-text-muted); }

:deep(.history-row--active) {
  background: var(--orket-bg-surface) !important;
  border-left: 2px solid var(--orket-accent-cyan);
}
</style>
