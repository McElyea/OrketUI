import { defineStore } from 'pinia';
import { ref } from 'vue';
import { sessionsApi } from '@/api/sessions.api';
import { logsApi, type LogEntry } from '@/api/logs.api';
import { systemApi } from '@/api/system.api';
import type { Run, RunMetrics, ReplayTurn } from '@/types/sessions';

export const useSessionStore = defineStore('session', () => {
  const runs = ref<Run[]>([]);
  const activeRun = ref<Run | null>(null);
  const activeRunMetrics = ref<RunMetrics | null>(null);
  const replayTurns = ref<ReplayTurn[]>([]);
  const loading = ref(false);

  async function fetchRuns() {
    try {
      runs.value = await sessionsApi.listRuns();
      // Set latest running session as active
      const running = runs.value.find((r) => r.status === 'running');
      if (running) {
        activeRun.value = running;
      } else if (!activeRun.value && runs.value.length > 0) {
        activeRun.value = runs.value[0];
      }
    } catch {
      // Silently fail — will retry on next poll
    }
  }

  async function refreshActiveSession() {
    if (!activeRun.value) {
      await fetchRuns();
      return;
    }
    try {
      activeRun.value = await sessionsApi.getRun(activeRun.value.session_id);
      activeRunMetrics.value = await sessionsApi.getRunMetrics(activeRun.value.session_id);
    } catch {
      // Session may have ended
      await fetchRuns();
    }
  }

  async function loadRunIntoWall(sessionId: string) {
    loading.value = true;
    try {
      activeRun.value = await sessionsApi.getRun(sessionId);
      activeRunMetrics.value = await sessionsApi.getRunMetrics(sessionId);
      await fetchReplayTimeline(sessionId);
    } catch {
      // Handle error
    } finally {
      loading.value = false;
    }
  }

  async function fetchReplayTimeline(sessionId: string, role?: string) {
    try {
      const logs = await logsApi.query({
        session_id: sessionId,
        event: 'turn_complete',
        role,
        limit: 2000,
      });
      replayTurns.value = toTimelineTurns(logs);
    } catch {
      replayTurns.value = [];
    }
  }

  async function fetchReplayTurnDetail(turn: ReplayTurn): Promise<ReplayTurn> {
    if (!activeRun.value?.session_id || !turn.issue_id || !turn.turn_index) {
      return turn;
    }

    const detailed = await sessionsApi.getReplayTurn(
      activeRun.value.session_id,
      turn.issue_id,
      turn.turn_index,
      turn.role || undefined,
    );

    const idx = replayTurns.value.findIndex(
      (item) => item.issue_id === turn.issue_id && item.turn_index === turn.turn_index,
    );

    if (idx >= 0) {
      replayTurns.value[idx] = {
        ...replayTurns.value[idx],
        ...detailed,
      };
      replayTurns.value = [...replayTurns.value];
      return replayTurns.value[idx];
    }

    return detailed;
  }

  async function startRun(params?: Parameters<typeof systemApi.runActive>[0]) {
    await systemApi.runActive(params);
    await fetchRuns();
  }

  async function haltRun() {
    if (!activeRun.value) return;
    await sessionsApi.haltSession(activeRun.value.session_id);
    await refreshActiveSession();
  }

  return {
    runs,
    activeRun,
    activeRunMetrics,
    replayTurns,
    loading,
    fetchRuns,
    refreshActiveSession,
    loadRunIntoWall,
    fetchReplayTimeline,
    fetchReplayTurnDetail,
    startRun,
    haltRun,
  };
});

function toTimelineTurns(entries: LogEntry[]): ReplayTurn[] {
  const ordered = [...entries].sort((a, b) => {
    const ai = typeof a.turn_index === 'number' ? a.turn_index : Number.MAX_SAFE_INTEGER;
    const bi = typeof b.turn_index === 'number' ? b.turn_index : Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return a.timestamp.localeCompare(b.timestamp);
  });

  const dedupe = new Set<string>();
  const turns: ReplayTurn[] = [];

  for (const entry of ordered) {
    if (!entry.issue_id || typeof entry.turn_index !== 'number') continue;
    const key = `${entry.issue_id}:${entry.turn_index}:${entry.role || ''}`;
    if (dedupe.has(key)) continue;
    dedupe.add(key);

    turns.push({
      turn_index: entry.turn_index,
      role: entry.role || 'unknown',
      issue_id: entry.issue_id,
      selected_model: entry.selected_model || '',
      tool_calls: [],
      tokens: entry.tokens || 0,
      duration_ms: entry.duration_ms || 0,
      timestamp: entry.timestamp,
      content: undefined,
      thought: undefined,
      prompt_id: undefined,
      guard_decision: undefined,
    });
  }

  return turns;
}
