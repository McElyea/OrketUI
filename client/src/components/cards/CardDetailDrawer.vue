<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    :style="{ width: '400px' }"
    :modal="false"
    class="card-detail-drawer"
  >
    <template #header>
      <div class="drawer-header" v-if="cards.selectedCard">
        <span class="font-mono text-xs text-muted">{{ cards.selectedCard.id }}</span>
        <StatusBadge :status="cards.selectedCard.status" />
      </div>
    </template>

    <div v-if="cards.loading" class="drawer-loading">Loading...</div>

    <div v-else-if="cards.selectedCard" class="drawer-content">
      <h3 class="drawer-title">{{ cards.selectedCard.name }}</h3>

      <div class="drawer-section">
        <div class="drawer-field">
          <span class="drawer-label">Type</span>
          <span>{{ cards.selectedCard.type }}</span>
        </div>
        <div class="drawer-field" v-if="cards.selectedCard.seat">
          <span class="drawer-label">Seat</span>
          <span>{{ cards.selectedCard.seat }}</span>
        </div>
        <div class="drawer-field">
          <span class="drawer-label">Priority</span>
          <span>{{ cards.selectedCard.priority }}</span>
        </div>
        <div class="drawer-field" v-if="cards.selectedCard.description">
          <span class="drawer-label">Description</span>
          <span class="text-sm">{{ cards.selectedCard.description }}</span>
        </div>
        <div class="drawer-field" v-if="cards.selectedCard.requirements">
          <span class="drawer-label">Requirements</span>
          <span class="text-sm">{{ cards.selectedCard.requirements }}</span>
        </div>
      </div>

      <!-- History -->
      <div class="drawer-section" v-if="cards.selectedHistory?.transitions?.length">
        <div class="drawer-section-title">State History</div>
        <div
          v-for="(t, i) in cards.selectedHistory.transitions"
          :key="i"
          class="drawer-transition"
        >
          <StatusBadge :status="t.from_status" />
          <i class="pi pi-arrow-right text-muted"></i>
          <StatusBadge :status="t.to_status" />
          <span class="text-xs text-muted font-mono">{{ formatTime(t.timestamp) }}</span>
        </div>
      </div>

      <!-- Comments -->
      <div class="drawer-section" v-if="cards.selectedComments.length">
        <div class="drawer-section-title">Comments</div>
        <div v-for="c in cards.selectedComments" :key="c.id" class="drawer-comment">
          <div class="drawer-comment-header">
            <span class="text-cyan text-xs">{{ c.author }}</span>
            <span class="text-muted text-xs font-mono">{{ formatTimeAgo(c.timestamp) }}</span>
          </div>
          <div class="text-sm">{{ c.content }}</div>
        </div>
      </div>
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import Drawer from 'primevue/drawer';
import { useCardsStore } from '@/stores/cards.store';
import StatusBadge from './StatusBadge.vue';
import { formatTime, formatTimeAgo } from '@/utils/formatters';

const visible = defineModel<boolean>('visible', { default: false });
const cards = useCardsStore();
</script>

<style scoped>
.drawer-header {
  display: flex;
  align-items: center;
  gap: var(--orket-space-md);
}

.drawer-loading {
  padding: var(--orket-space-xl);
  color: var(--orket-text-muted);
  text-align: center;
}

.drawer-content {
  display: flex;
  flex-direction: column;
  gap: var(--orket-space-lg);
}

.drawer-title {
  font-size: var(--orket-font-size-lg);
  color: var(--orket-text-primary);
}

.drawer-section {
  display: flex;
  flex-direction: column;
  gap: var(--orket-space-md);
}

.drawer-section-title {
  font-size: var(--orket-font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--orket-text-secondary);
  padding-bottom: var(--orket-space-sm);
  border-bottom: 1px solid var(--orket-border);
}

.drawer-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.drawer-label {
  font-size: var(--orket-font-size-xs);
  color: var(--orket-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.drawer-transition {
  display: flex;
  align-items: center;
  gap: var(--orket-space-sm);
}

.drawer-comment {
  padding: var(--orket-space-md);
  background: var(--orket-bg-surface);
  border-radius: var(--orket-radius-sm);
}

.drawer-comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--orket-space-sm);
}

:deep(.card-detail-drawer.p-drawer) {
  background: var(--orket-bg-panel) !important;
  border-left: 1px solid var(--orket-border) !important;
  color: var(--orket-text-primary) !important;
  box-shadow: -16px 0 40px rgba(0, 0, 0, 0.45) !important;
}

:deep(.card-detail-drawer .p-drawer-header) {
  background: var(--orket-bg-surface) !important;
  border-bottom: 1px solid var(--orket-border) !important;
  color: var(--orket-text-primary) !important;
}

:deep(.card-detail-drawer .p-drawer-content) {
  background: var(--orket-bg-panel) !important;
  color: var(--orket-text-secondary) !important;
}

:deep(.card-detail-drawer .p-drawer-title) {
  color: var(--orket-text-primary) !important;
}

:deep(.card-detail-drawer .p-drawer-close-button) {
  color: var(--orket-text-muted) !important;
}

:deep(.card-detail-drawer .p-drawer-close-button:hover) {
  background: var(--orket-bg-elevated) !important;
  color: var(--orket-text-primary) !important;
}
</style>
