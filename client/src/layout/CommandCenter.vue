<template>
  <div class="command-center">
    <TopBar :wsStatus="wsStatus" />

    <div class="command-center__body">
      <Splitter class="main-v-splitter" layout="vertical" style="height: 100%">
        <!-- Top row: 70% -->
        <SplitterPanel :size="70" :minSize="40">
          <Splitter class="top-h-splitter" style="height: 100%">
            <!-- Left: Card Flow 25% -->
            <SplitterPanel :size="25" :minSize="15">
              <CardFlowPanel />
            </SplitterPanel>

            <!-- Center: DAG + Replay stacked 45% -->
            <SplitterPanel :size="45" :minSize="25">
              <Splitter layout="vertical" style="height: 100%">
                <SplitterPanel :size="55" :minSize="30">
                  <PipelineDAGPanel />
                </SplitterPanel>
                <SplitterPanel :size="45" :minSize="20">
                  <TurnReplayPanel />
                </SplitterPanel>
              </Splitter>
            </SplitterPanel>

            <!-- Right: Roster + Guard + Sandbox stacked 30% -->
            <SplitterPanel :size="30" :minSize="15">
              <Splitter layout="vertical" style="height: 100%">
                <SplitterPanel :size="40" :minSize="20">
                  <ModelRosterPanel />
                </SplitterPanel>
                <SplitterPanel :size="35" :minSize="15">
                  <GuardReviewPanel />
                </SplitterPanel>
                <SplitterPanel :size="25" :minSize="10">
                  <SandboxMonitorPanel />
                </SplitterPanel>
              </Splitter>
            </SplitterPanel>
          </Splitter>
        </SplitterPanel>

        <!-- Bottom row: 30% -->
        <SplitterPanel :size="30" :minSize="15">
          <Splitter class="bottom-h-splitter" style="height: 100%">
            <SplitterPanel :size="20" :minSize="10">
              <MetricsStripPanel />
            </SplitterPanel>
            <SplitterPanel :size="50" :minSize="25">
              <LogConsolePanel />
            </SplitterPanel>
            <SplitterPanel :size="30" :minSize="15">
              <OperatorConsole />
            </SplitterPanel>
          </Splitter>
        </SplitterPanel>
      </Splitter>
    </div>

    <StatusBar :wsStatus="wsStatus" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import Splitter from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';

import TopBar from './TopBar.vue';
import StatusBar from './StatusBar.vue';

import CardFlowPanel from '@/views/CardFlowPanel.vue';
import PipelineDAGPanel from '@/views/PipelineDAGPanel.vue';
import TurnReplayPanel from '@/views/TurnReplayPanel.vue';
import ModelRosterPanel from '@/views/ModelRosterPanel.vue';
import GuardReviewPanel from '@/views/GuardReviewPanel.vue';
import SandboxMonitorPanel from '@/views/SandboxMonitorPanel.vue';
import MetricsStripPanel from '@/views/MetricsStripPanel.vue';
import LogConsolePanel from '@/views/LogConsolePanel.vue';
import OperatorConsole from '@/views/OperatorConsole.vue';

import { useWebSocket } from '@/composables/useWebSocket';
import { usePolling } from '@/composables/usePolling';
import { useEventsStore } from '@/stores/events.store';
import { useBoardStore } from '@/stores/board.store';
import { useSessionStore } from '@/stores/session.store';
import { useMetricsStore } from '@/stores/metrics.store';
import { useLogsStore } from '@/stores/logs.store';
import { useSandboxesStore } from '@/stores/sandboxes.store';
import type { RuntimeEvent } from '@/types/websocket';
import {
  POLL_METRICS_MS,
  POLL_BOARD_MS,
  POLL_LOGS_MS,
  POLL_SANDBOXES_MS,
} from '@/utils/constants';

const events = useEventsStore();
const board = useBoardStore();
const session = useSessionStore();
const metrics = useMetricsStore();
const logs = useLogsStore();
const sandboxes = useSandboxesStore();

// --- WebSocket ---
function handleWsEvent(event: RuntimeEvent) {
  events.push(event);

  // Trigger targeted store refreshes
  if (event.event === 'session_start' || event.event === 'session_end') {
    session.refreshActiveSession();
  }

  if (
    event.event === 'turn_complete' ||
    event.event === 'turn_failed' ||
    event.event === 'runtime_verifier_completed'
  ) {
    board.refreshBoard();
    const throughput = extractThroughput(event);
    if (throughput) metrics.recordTokens(throughput.tokens, throughput.durationMs);
  }

  if (event.event === 'turn_complete' && session.activeRun) {
    session.fetchReplayTimeline(session.activeRun.session_id);
  }
}

const { status: wsStatus, connect: wsConnect, disconnect: wsDisconnect } = useWebSocket(handleWsEvent);

// --- Polling ---
const metricsPoll = usePolling(async () => {
  await metrics.fetchMetrics();
  await metrics.fetchHeartbeat();
}, POLL_METRICS_MS);

const boardPoll = usePolling(() => board.refreshBoard(), POLL_BOARD_MS);
const logsPoll = usePolling(() => logs.fetchLogs(), POLL_LOGS_MS);
const sandboxPoll = usePolling(() => sandboxes.fetchSandboxes(), POLL_SANDBOXES_MS);

onMounted(async () => {
  // Initial data load
  await Promise.all([
    board.refreshBoard(),
    session.fetchRuns(),
    logs.loadInitial(),
    metrics.fetchMetrics(),
    metrics.fetchHeartbeat(),
    sandboxes.fetchSandboxes(),
  ]);

  if (session.activeRun?.session_id) {
    await session.fetchReplayTimeline(session.activeRun.session_id);
  }

  // Start real-time
  wsConnect();
  metricsPoll.start();
  boardPoll.start();
  logsPoll.start();
  sandboxPoll.start();
});

onUnmounted(() => {
  wsDisconnect();
  metricsPoll.stop();
  boardPoll.stop();
  logsPoll.stop();
  sandboxPoll.stop();
});

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as AnyRecord;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function extractThroughput(event: RuntimeEvent): { tokens: number; durationMs: number } | null {
  const root = event as unknown as AnyRecord;
  const usage = asRecord(root.usage);

  const inputTokens = asNumber(root.input_tokens) ?? 0;
  const outputTokens = asNumber(root.output_tokens) ?? 0;
  const tokens =
    asNumber(event.tokens) ??
    asNumber(root.total_tokens) ??
    asNumber(usage?.total_tokens) ??
    (inputTokens + outputTokens > 0 ? inputTokens + outputTokens : undefined);

  const durationMs =
    asNumber(event.duration_ms) ??
    asNumber(root.duration) ??
    asNumber(root.elapsed_ms);

  if (!tokens || !durationMs || tokens <= 0 || durationMs <= 0) return null;
  return { tokens, durationMs };
}
</script>

<style scoped>
.command-center {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: var(--orket-bg-base);
}

.command-center__body {
  flex: 1;
  min-height: 0;
}
</style>
