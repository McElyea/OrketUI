import type { CardStatus } from '@/types/cards';
import type { ModelActivityState } from '@/types/websocket';

export const statusColors: Record<CardStatus, string> = {
  ready: 'var(--orket-status-ready)',
  in_progress: 'var(--orket-status-in-progress)',
  blocked: 'var(--orket-status-blocked)',
  waiting_for_developer: 'var(--orket-status-waiting)',
  ready_for_testing: 'var(--orket-accent-blue)',
  code_review: 'var(--orket-status-code-review)',
  awaiting_guard_review: 'var(--orket-status-guard-review)',
  guard_approved: 'var(--orket-status-guard-approved)',
  guard_rejected: 'var(--orket-status-guard-rejected)',
  guard_requested_changes: 'var(--orket-status-guard-changes)',
  done: 'var(--orket-status-done)',
  canceled: 'var(--orket-status-canceled)',
  archived: 'var(--orket-status-archived)',
};

export const statusLabels: Record<CardStatus, string> = {
  ready: 'Ready',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  waiting_for_developer: 'Waiting',
  ready_for_testing: 'Testing',
  code_review: 'Code Review',
  awaiting_guard_review: 'Guard Review',
  guard_approved: 'Approved',
  guard_rejected: 'Rejected',
  guard_requested_changes: 'Changes Req.',
  done: 'Done',
  canceled: 'Canceled',
  archived: 'Archived',
};

export const activityColors: Record<ModelActivityState, string> = {
  reading: 'var(--orket-activity-reading)',
  thinking: 'var(--orket-activity-thinking)',
  writing: 'var(--orket-activity-writing)',
  empty: 'var(--orket-activity-empty)',
};

export const activityLabels: Record<ModelActivityState, string> = {
  reading: 'Reading',
  thinking: 'Thinking',
  writing: 'Writing',
  empty: 'Idle',
};

/** Resolve a CSS variable to its raw hex value for ECharts (which can't use CSS vars) */
export const statusHexColors: Record<CardStatus, string> = {
  ready: '#448aff',
  in_progress: '#00d4ff',
  blocked: '#ff4455',
  waiting_for_developer: '#ffaa00',
  ready_for_testing: '#448aff',
  code_review: '#b388ff',
  awaiting_guard_review: '#b388ff',
  guard_approved: '#00ff88',
  guard_rejected: '#ff4455',
  guard_requested_changes: '#ffaa00',
  done: '#00ff88',
  canceled: '#4a5568',
  archived: '#3a4560',
};
