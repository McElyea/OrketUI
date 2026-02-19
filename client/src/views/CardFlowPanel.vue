<template>
  <div class="panel">
    <PanelHeader title="Card Flow" icon="pi pi-th-large" :live="board.loading" />
    <div class="panel__body panel__body--no-pad">
      <div class="kanban" v-if="board.allIssues.length > 0">
        <CardColumn title="Ready" :issues="byStatus('ready')" @select="openCard" />
        <CardColumn title="In Progress" :issues="byStatus('in_progress')" @select="openCard" />
        <CardColumn title="Blocked" :issues="blockedIssues" @select="openCard" />
        <CardColumn title="Review" :issues="reviewIssues" @select="openCard" />
        <CardColumn title="Done" :issues="byStatus('done')" @select="openCard" />
      </div>
      <EmptyState v-else message="No cards loaded" icon="pi pi-th-large" />
    </div>

    <CardDetailDrawer v-model:visible="drawerVisible" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import PanelHeader from '@/layout/PanelHeader.vue';
import CardColumn from '@/components/cards/CardColumn.vue';
import CardDetailDrawer from '@/components/cards/CardDetailDrawer.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
import { useBoardStore } from '@/stores/board.store';
import { useCardsStore } from '@/stores/cards.store';
import type { CardStatus } from '@/types/cards';
import type { BoardIssue } from '@/types/system';

const board = useBoardStore();
const cards = useCardsStore();
const drawerVisible = ref(false);

function byStatus(status: CardStatus): BoardIssue[] {
  return board.allIssues.filter((i) => i.status === status);
}

const blockedIssues = computed(() =>
  board.allIssues.filter((i) =>
    ['blocked', 'waiting_for_developer'].includes(i.status),
  ),
);

const reviewIssues = computed(() =>
  board.allIssues.filter((i) =>
    ['code_review', 'awaiting_guard_review', 'guard_requested_changes', 'ready_for_testing'].includes(i.status),
  ),
);

async function openCard(id: string) {
  await cards.selectCard(id);
  drawerVisible.value = true;
}
</script>

<style scoped>
.kanban {
  display: flex;
  height: 100%;
  overflow-x: auto;
  gap: 1px;
  background: var(--orket-border);
}
</style>
