import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { systemApi } from '@/api/system.api';
import { sessionsApi } from '@/api/sessions.api';
import type { Board, BoardRock, BoardEpic, BoardIssue, BoardAlert } from '@/types/system';
import type { BacklogItem } from '@/types/sessions';
import type { CardStatus } from '@/types/cards';

export const useBoardStore = defineStore('board', () => {
  const rocks = ref<BoardRock[]>([]);
  const orphanedEpics = ref<BoardEpic[]>([]);
  const orphanedIssues = ref<BoardIssue[]>([]);
  const alerts = ref<BoardAlert[]>([]);
  const artifacts = ref<string[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /** Flatten all issues from the board hierarchy */
  const allIssues = computed<BoardIssue[]>(() => {
    const issues: BoardIssue[] = [];
    for (const rock of rocks.value) {
      for (const epic of rock.epics) {
        issues.push(...epic.issues);
      }
    }
    for (const epic of orphanedEpics.value) {
      issues.push(...epic.issues);
    }
    issues.push(...orphanedIssues.value);
    return issues;
  });

  /** All epics (from rocks + orphaned) */
  const allEpics = computed<BoardEpic[]>(() => {
    const epics: BoardEpic[] = [];
    for (const rock of rocks.value) {
      epics.push(...rock.epics);
    }
    epics.push(...orphanedEpics.value);
    return epics;
  });

  async function refreshBoard() {
    loading.value = true;
    error.value = null;
    try {
      const board = normalizeBoard(await systemApi.board());
      let normalizedOrphanedIssues = board.orphaned_issues;

      // Compatibility fallback: some backend modes return an empty board but keep
      // active cards in /runs/{session}/backlog.
      const isBoardEmpty =
        board.rocks.length === 0 &&
        board.orphaned_epics.length === 0 &&
        board.orphaned_issues.length === 0;

      if (isBoardEmpty) {
        const runs = await sessionsApi.listRuns();
        const activeRun = runs.find((r) => r.status === 'running') ?? runs[0];

        if (activeRun?.session_id) {
          const backlog = await sessionsApi.getRunBacklog(activeRun.session_id);
          normalizedOrphanedIssues = backlog.map(backlogToBoardIssue);
        }
      }

      rocks.value = board.rocks;
      orphanedEpics.value = board.orphaned_epics;
      orphanedIssues.value = normalizedOrphanedIssues;
      alerts.value = board.alerts;
      artifacts.value = board.artifacts;
    } catch (e) {
      // Fallback if board endpoint shape/path isn't supported but run backlog exists.
      try {
        const runs = await sessionsApi.listRuns();
        const activeRun = runs.find((r) => r.status === 'running') ?? runs[0];
        if (activeRun?.session_id) {
          const backlog = await sessionsApi.getRunBacklog(activeRun.session_id);
          rocks.value = [];
          orphanedEpics.value = [];
          orphanedIssues.value = backlog.map(backlogToBoardIssue);
          alerts.value = [];
          artifacts.value = [];
          error.value = null;
          return;
        }
      } catch {
        // ignore and set original board error below
      }

      error.value = e instanceof Error ? e.message : 'Failed to load board';
    } finally {
      loading.value = false;
    }
  }

  function backlogToBoardIssue(item: BacklogItem): BoardIssue {
    return {
      id: item.issue_id,
      name: item.name,
      seat: item.seat || 'unknown',
      priority: item.priority,
      status: normalizeStatus(item.status),
      depends_on: [],
      retry_count: 0,
      max_retries: 0,
    };
  }

  return {
    rocks,
    orphanedEpics,
    orphanedIssues,
    alerts,
    artifacts,
    allIssues,
    allEpics,
    loading,
    error,
    refreshBoard,
  };
});

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as AnyRecord;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function normalizeStatus(raw: unknown): CardStatus {
  const value = String(raw ?? '').toLowerCase();
  const compact = value.replace(/[\s-]+/g, '_');

  const mapped: Record<string, CardStatus> = {
    todo: 'ready',
    queued: 'ready',
    pending: 'ready',
    started: 'in_progress',
    running: 'in_progress',
    inprogress: 'in_progress',
    in_progress: 'in_progress',
    waiting: 'waiting_for_developer',
    waiting_for_input: 'waiting_for_developer',
    waiting_for_developer: 'waiting_for_developer',
    blocked: 'blocked',
    code_review: 'code_review',
    review: 'code_review',
    ready_for_testing: 'ready_for_testing',
    testing: 'ready_for_testing',
    awaiting_guard_review: 'awaiting_guard_review',
    guard_approved: 'guard_approved',
    guard_rejected: 'guard_rejected',
    guard_requested_changes: 'guard_requested_changes',
    done: 'done',
    complete: 'done',
    completed: 'done',
    success: 'done',
    canceled: 'canceled',
    cancelled: 'canceled',
    archived: 'archived',
  };

  return mapped[compact] ?? 'ready';
}

function normalizeIssue(raw: unknown): BoardIssue | null {
  const row = asRecord(raw);
  if (!row) return null;

  const id = asString(row.id) ?? asString(row.issue_id) ?? asString(row.card_id);
  if (!id) return null;

  return {
    id,
    name: asString(row.name) ?? asString(row.summary) ?? id,
    seat: asString(row.seat) ?? asString(row.role) ?? 'unknown',
    priority: asNumber(row.priority, 1),
    status: normalizeStatus(row.status),
    depends_on: asStringArray(row.depends_on),
    retry_count: asNumber(row.retry_count),
    max_retries: asNumber(row.max_retries),
    verification: asRecord(row.verification) ?? undefined,
    metrics: asRecord(row.metrics) ?? undefined,
  };
}

function normalizeEpic(raw: unknown): BoardEpic | null {
  const row = asRecord(raw);
  if (!row) return null;

  const id = asString(row.id) ?? asString(row.epic_id);
  if (!id) return null;

  const issues = (Array.isArray(row.issues) ? row.issues : [])
    .map((issue) => normalizeIssue(issue))
    .filter((issue): issue is BoardIssue => issue !== null);

  return {
    id,
    name: asString(row.name) ?? asString(row.summary) ?? id,
    description: asString(row.description),
    status: normalizeStatus(row.status),
    team: asString(row.team),
    environment: asString(row.environment),
    issues,
    error: asString(row.error),
  };
}

function normalizeRock(raw: unknown): BoardRock | null {
  const row = asRecord(raw);
  if (!row) return null;

  const id = asString(row.id) ?? asString(row.rock_id);
  if (!id) return null;

  const epics = (Array.isArray(row.epics) ? row.epics : [])
    .map((epic) => normalizeEpic(epic))
    .filter((epic): epic is BoardEpic => epic !== null);

  return {
    id,
    name: asString(row.name) ?? asString(row.summary) ?? id,
    description: asString(row.description),
    status: normalizeStatus(row.status),
    epics,
  };
}

function normalizeBoard(raw: unknown): Board {
  const input = asRecord(raw) ?? {};
  const board = asRecord(input.board) ?? input;

  const rocks = (Array.isArray(board.rocks) ? board.rocks : [])
    .map((rock) => normalizeRock(rock))
    .filter((rock): rock is BoardRock => rock !== null);

  const orphanedEpics = (Array.isArray(board.orphaned_epics) ? board.orphaned_epics : [])
    .map((epic) => normalizeEpic(epic))
    .filter((epic): epic is BoardEpic => epic !== null);

  const orphanedIssues = (
    Array.isArray(board.orphaned_issues)
      ? board.orphaned_issues
      : Array.isArray(board.issues)
        ? board.issues
        : Array.isArray(board.cards)
          ? board.cards
          : []
  )
    .map((issue) => normalizeIssue(issue))
    .filter((issue): issue is BoardIssue => issue !== null);

  const alerts = (Array.isArray(board.alerts) ? board.alerts : [])
    .map((alert) => asRecord(alert))
    .filter((alert): alert is AnyRecord => alert !== null)
    .map((alert) => ({
      type: (asString(alert.type) as BoardAlert['type']) || 'info',
      message: asString(alert.message) || '',
      action_required: asString(alert.action_required),
    }));

  const artifacts = asStringArray(board.artifacts);

  return { rocks, orphaned_epics: orphanedEpics, orphaned_issues: orphanedIssues, alerts, artifacts };
}
