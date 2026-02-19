import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { RuntimeEvent, RoleActivityEntry, ModelActivityState } from '@/types/websocket';
import { EVENT_BUFFER_SIZE } from '@/utils/constants';

export const useEventsStore = defineStore('events', () => {
  const buffer = ref<RuntimeEvent[]>([]);

  /** Last event per role, used by ModelRosterPanel */
  const roleActivity = ref<Map<string, RoleActivityEntry>>(new Map());

  /** Guard-related events for GuardReviewPanel */
  const guardEvents = computed(() =>
    buffer.value.filter((e) => e.event === 'runtime_verifier_completed' || e.event.startsWith('guard_')),
  );

  function push(event: RuntimeEvent) {
    buffer.value.push(event);
    if (buffer.value.length > EVENT_BUFFER_SIZE) {
      buffer.value = buffer.value.slice(-EVENT_BUFFER_SIZE);
    }

    // Update role activity state for any role-tagged event.
    if (event.role) {
      const previous = roleActivity.value.get(event.role);
      const state = deriveActivityState(event);
      roleActivity.value.set(event.role, {
        role: event.role,
        model: event.selected_model || previous?.model || '-',
        state,
        issue_id: event.issue_id,
        turn_index: event.turn_index,
        timestamp: event.timestamp,
      });
      // Trigger reactivity on the Map
      roleActivity.value = new Map(roleActivity.value);
    }
  }

  function clear() {
    buffer.value = [];
    roleActivity.value = new Map();
  }

  return { buffer, roleActivity, guardEvents, push, clear };
});

function deriveActivityState(event: RuntimeEvent): ModelActivityState {
  switch (event.event) {
    case 'turn_start':
      return 'reading';
    case 'turn_complete':
    case 'turn_failed':
    case 'runtime_verifier_completed':
    case 'guard_terminal_failure':
      return 'empty';
    case 'guard_retry_scheduled':
      return 'thinking';
    default:
      return 'empty';
  }
}
