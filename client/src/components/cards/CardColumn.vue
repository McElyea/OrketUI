<template>
  <div class="card-column">
    <div class="card-column__header">
      <span class="card-column__title">{{ title }}</span>
      <span class="card-column__count">{{ issues.length }}</span>
    </div>
    <div class="card-column__body">
      <CardTile
        v-for="issue in issues"
        :key="issue.id"
        :issue="issue"
        @select="$emit('select', $event)"
      />
      <EmptyState v-if="issues.length === 0" message="No cards" icon="pi pi-check-circle" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BoardIssue } from '@/types/system';
import CardTile from './CardTile.vue';
import EmptyState from '@/components/shared/EmptyState.vue';

defineProps<{
  title: string;
  issues: BoardIssue[];
}>();

defineEmits<{ select: [id: string] }>();
</script>

<style scoped>
.card-column {
  display: flex;
  flex-direction: column;
  min-width: 180px;
  flex: 1;
  height: 100%;
}

.card-column__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--orket-space-sm) var(--orket-space-md);
  font-size: var(--orket-font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--orket-text-secondary);
  border-bottom: 1px solid var(--orket-border);
}

.card-column__count {
  font-family: var(--orket-font-mono);
  color: var(--orket-text-muted);
}

.card-column__body {
  flex: 1;
  overflow-y: auto;
  padding: var(--orket-space-sm);
  display: flex;
  flex-direction: column;
  gap: var(--orket-space-sm);
}
</style>
