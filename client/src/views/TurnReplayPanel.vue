<template>
  <div class="panel">
    <PanelHeader title="Turn Replay" icon="pi pi-history" :live="hasActiveTurns">
      <template #actions>
        <select
          v-model="roleFilter"
          class="replay-filter"
          @change="refreshReplay"
        >
          <option value="">All roles</option>
          <option v-for="role in availableRoles" :key="role" :value="role">{{ role }}</option>
        </select>
      </template>
    </PanelHeader>
    <div class="panel__body panel__body--no-pad">
      <div class="replay" v-if="session.replayTurns.length > 0">
        <!-- Timeline sidebar -->
        <div class="replay__timeline">
          <div
            v-for="turn in session.replayTurns"
            :key="`${turn.issue_id}:${turn.turn_index}:${turn.role}`"
            class="replay__turn-item"
            :class="{ 'replay__turn-item--active': isSelected(turn) }"
            @click="selectTurn(turn)"
          >
            <span class="replay__turn-idx font-mono">{{ turn.turn_index }}</span>
            <span class="replay__turn-role truncate">{{ turn.role }}</span>
            <span class="replay__turn-tokens font-mono text-muted">{{ formatTokens(turn.tokens) }}</span>
          </div>
        </div>

        <!-- Detail view -->
        <div class="replay__detail" v-if="selectedTurn">
          <div class="replay__detail-header">
            <span class="text-cyan font-mono">{{ selectedTurn.role }}</span>
            <span class="text-muted text-xs">{{ selectedTurn.selected_model }}</span>
            <span class="text-muted text-xs font-mono">{{ formatDuration(selectedTurn.duration_ms) }}</span>
            <span class="text-muted text-xs font-mono">{{ formatTokens(selectedTurn.tokens) }} tokens</span>
          </div>

          <div class="replay__detail-tabs">
            <button
              v-for="tab in tabs"
              :key="tab"
              class="replay__tab"
              :class="{ 'replay__tab--active': activeTab === tab }"
              @click="activeTab = tab"
            >{{ tab }}</button>
          </div>

          <div class="replay__detail-body font-mono text-sm">
            <template v-if="activeTab === 'Output'">
              <pre class="replay__pre">{{ selectedTurn.content || 'No output' }}</pre>
            </template>
            <template v-else-if="activeTab === 'Tool Calls'">
              <div v-for="(tc, i) in selectedTurn.tool_calls" :key="i" class="replay__tool-call">
                <div class="text-cyan">{{ tc.name }}</div>
                <pre class="replay__pre text-xs">{{ JSON.stringify(tc.arguments, null, 2) }}</pre>
                <pre v-if="tc.result" class="replay__pre text-xs text-green">{{ JSON.stringify(tc.result, null, 2) }}</pre>
              </div>
              <span v-if="!selectedTurn.tool_calls?.length" class="text-muted">No tool calls</span>
            </template>
            <template v-else-if="activeTab === 'Reasoning'">
              <pre class="replay__pre">{{ selectedTurn.thought || 'No reasoning captured' }}</pre>
            </template>
          </div>
        </div>
      </div>
      <EmptyState v-else message="No turns yet" icon="pi pi-history" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import PanelHeader from '@/layout/PanelHeader.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
import { useSessionStore } from '@/stores/session.store';
import { formatTokens, formatDuration } from '@/utils/formatters';
import type { ReplayTurn } from '@/types/sessions';

const session = useSessionStore();
const selectedTurn = ref<ReplayTurn | null>(null);
const roleFilter = ref('');
const activeTab = ref<'Output' | 'Tool Calls' | 'Reasoning'>('Output');
const tabs = ['Output', 'Tool Calls', 'Reasoning'] as const;

const availableRoles = computed(() => {
  const roles = new Set(session.replayTurns.map((t) => t.role));
  return [...roles].sort();
});

const hasActiveTurns = computed(() => session.replayTurns.length > 0);

// Auto-select latest turn when new turns arrive
watch(
  () => session.replayTurns.length,
  () => {
    if (session.replayTurns.length > 0 && !selectedTurn.value) {
      selectTurn(session.replayTurns[session.replayTurns.length - 1]);
    }
  },
);

async function refreshReplay() {
  if (session.activeRun) {
    await session.fetchReplayTimeline(session.activeRun.session_id, roleFilter.value || undefined);
    selectedTurn.value = null;
  }
}

function isSelected(turn: ReplayTurn): boolean {
  return (
    selectedTurn.value?.issue_id === turn.issue_id &&
    selectedTurn.value?.turn_index === turn.turn_index &&
    selectedTurn.value?.role === turn.role
  );
}

async function selectTurn(turn: ReplayTurn) {
  selectedTurn.value = turn;
  try {
    const detailed = await session.fetchReplayTurnDetail(turn);
    selectedTurn.value = detailed;
  } catch {
    // Keep timeline responsive even if targeted replay detail fails.
  }
}
</script>

<style scoped>
.replay {
  display: flex;
  height: 100%;
}

.replay__timeline {
  width: 180px;
  min-width: 180px;
  border-right: 1px solid var(--orket-border);
  overflow-y: auto;
}

.replay__turn-item {
  display: flex;
  align-items: center;
  gap: var(--orket-space-sm);
  padding: var(--orket-space-sm) var(--orket-space-md);
  cursor: pointer;
  border-bottom: 1px solid var(--orket-border);
  transition: background var(--orket-transition-fast);
}

.replay__turn-item:hover {
  background: var(--orket-bg-elevated);
}

.replay__turn-item--active {
  background: var(--orket-bg-surface);
  border-left: 2px solid var(--orket-accent-cyan);
}

.replay__turn-idx {
  font-size: var(--orket-font-size-xs);
  color: var(--orket-accent-cyan);
  min-width: 20px;
}

.replay__turn-role {
  flex: 1;
  font-size: var(--orket-font-size-xs);
  color: var(--orket-text-primary);
}

.replay__turn-tokens {
  font-size: var(--orket-font-size-xs);
}

.replay__detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.replay__detail-header {
  display: flex;
  align-items: center;
  gap: var(--orket-space-lg);
  padding: var(--orket-space-md);
  border-bottom: 1px solid var(--orket-border);
}

.replay__detail-tabs {
  display: flex;
  border-bottom: 1px solid var(--orket-border);
}

.replay__tab {
  padding: var(--orket-space-sm) var(--orket-space-lg);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--orket-text-secondary);
  font-size: var(--orket-font-size-xs);
  cursor: pointer;
  transition: all var(--orket-transition-fast);
}

.replay__tab:hover { color: var(--orket-text-primary); }
.replay__tab--active {
  color: var(--orket-accent-cyan);
  border-bottom-color: var(--orket-accent-cyan);
}

.replay__detail-body {
  flex: 1;
  overflow: auto;
  padding: var(--orket-space-md);
}

.replay__pre {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  line-height: 1.5;
}

.replay__tool-call {
  padding: var(--orket-space-md);
  background: var(--orket-bg-surface);
  border-radius: var(--orket-radius-sm);
  margin-bottom: var(--orket-space-md);
}

.replay-filter {
  padding: 2px 6px;
  background: var(--orket-bg-surface);
  border: 1px solid var(--orket-border);
  border-radius: var(--orket-radius-sm);
  color: var(--orket-text-secondary);
  font-size: var(--orket-font-size-xs);
  font-family: var(--orket-font-mono);
}
</style>
