<template>
  <div class="panel">
    <PanelHeader title="Model Roster" icon="pi pi-users" :live="activeCount > 0" />
    <div class="panel__body panel__body--no-pad">
      <div class="roster-grid" v-if="roleEntries.length > 0">
        <div
          v-for="entry in roleEntries"
          :key="entry.role"
          class="role-card"
          :class="`role-card--${entry.state}`"
        >
          <div class="role-card__header">
            <span class="role-card__indicator" :style="{ background: activityColors[entry.state] }"></span>
            <span class="role-card__name">{{ entry.role }}</span>
          </div>
          <div class="role-card__model font-mono">{{ entry.model || '-' }}</div>
          <div class="role-card__status">
            <span class="role-card__state-label" :style="{ color: activityColors[entry.state] }">
              {{ activityLabels[entry.state] }}
            </span>
            <span v-if="entry.issue_id" class="role-card__issue text-muted font-mono">
              {{ entry.issue_id }}
            </span>
          </div>
        </div>
      </div>
      <EmptyState v-else message="No active models" icon="pi pi-users" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PanelHeader from '@/layout/PanelHeader.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
import { useEventsStore } from '@/stores/events.store';
import { activityColors, activityLabels } from '@/utils/colors';
import type { RoleActivityEntry } from '@/types/websocket';

const events = useEventsStore();

const roleEntries = computed<RoleActivityEntry[]>(() => {
  return [...events.roleActivity.values()].sort((a, b) => a.role.localeCompare(b.role));
});

const activeCount = computed(() =>
  roleEntries.value.filter((e) => e.state !== 'empty').length,
);
</script>

<style scoped>
.roster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--orket-space-md);
  padding: var(--orket-space-md);
  height: 100%;
  overflow-y: auto;
  align-content: start;
}

.role-card {
  background: var(--orket-bg-surface);
  border: 1px solid var(--orket-border);
  border-radius: var(--orket-radius-md);
  padding: var(--orket-space-md);
  transition: all var(--orket-transition-fast);
}

.role-card--reading {
  border-color: var(--orket-accent-cyan);
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.15);
}

.role-card--thinking {
  border-color: var(--orket-accent-amber);
  box-shadow: 0 0 8px rgba(255, 170, 0, 0.15);
  animation: pulse-border 2s ease-in-out infinite;
}

.role-card--writing {
  border-color: var(--orket-accent-green);
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.15);
}

.role-card--empty {
  opacity: 0.5;
}

.role-card__header {
  display: flex;
  align-items: center;
  gap: var(--orket-space-sm);
  margin-bottom: var(--orket-space-sm);
}

.role-card__indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.role-card--reading .role-card__indicator,
.role-card--thinking .role-card__indicator,
.role-card--writing .role-card__indicator {
  box-shadow: 0 0 6px currentColor;
  animation: pulse-dot 1.5s ease-in-out infinite;
}

.role-card__name {
  font-size: var(--orket-font-size-sm);
  font-weight: 600;
  color: var(--orket-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-card__model {
  font-size: var(--orket-font-size-xs);
  color: var(--orket-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: var(--orket-space-xs);
}

.role-card__status {
  display: flex;
  align-items: center;
  gap: var(--orket-space-sm);
}

.role-card__state-label {
  font-size: var(--orket-font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.role-card__issue {
  font-size: 9px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@keyframes pulse-border {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
