<template>
  <div class="card-tile" @click="$emit('select', issue.id)">
    <div class="card-tile__header">
      <span class="card-tile__id font-mono">{{ issue.id }}</span>
      <StatusBadge :status="issue.status" />
    </div>
    <div class="card-tile__name truncate">{{ issue.name }}</div>
    <div class="card-tile__meta">
      <span v-if="issue.seat" class="card-tile__seat">
        <i class="pi pi-user"></i> {{ issue.seat }}
      </span>
      <span v-if="issue.retry_count > 0" class="card-tile__retry">
        <i class="pi pi-replay"></i> {{ issue.retry_count }}/{{ issue.max_retries }}
      </span>
      <span class="card-tile__priority" :class="`card-tile__priority--${priorityLabel}`">
        {{ priorityLabel }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BoardIssue } from '@/types/system';
import StatusBadge from './StatusBadge.vue';

const props = defineProps<{ issue: BoardIssue }>();
defineEmits<{ select: [id: string] }>();

const priorityLabel = computed(() => {
  if (props.issue.priority >= 3) return 'high';
  if (props.issue.priority >= 2) return 'med';
  return 'low';
});
</script>

<style scoped>
.card-tile {
  padding: var(--orket-space-md);
  background: var(--orket-bg-surface);
  border: 1px solid var(--orket-border);
  border-radius: var(--orket-radius-md);
  cursor: pointer;
  transition: all var(--orket-transition-fast);
}

.card-tile:hover {
  border-color: var(--orket-border-active);
  background: var(--orket-bg-elevated);
}

.card-tile__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--orket-space-sm);
}

.card-tile__id {
  font-size: var(--orket-font-size-xs);
  color: var(--orket-text-muted);
}

.card-tile__name {
  font-size: var(--orket-font-size-sm);
  color: var(--orket-text-primary);
  margin-bottom: var(--orket-space-sm);
}

.card-tile__meta {
  display: flex;
  align-items: center;
  gap: var(--orket-space-md);
  font-size: var(--orket-font-size-xs);
  color: var(--orket-text-secondary);
}

.card-tile__seat, .card-tile__retry {
  display: flex;
  align-items: center;
  gap: 2px;
}

.card-tile__retry {
  color: var(--orket-accent-amber);
}

.card-tile__priority--high { color: var(--orket-accent-red); }
.card-tile__priority--med { color: var(--orket-accent-amber); }
.card-tile__priority--low { color: var(--orket-text-muted); }
</style>
