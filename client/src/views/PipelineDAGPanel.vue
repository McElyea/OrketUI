<template>
  <div class="panel" ref="panelRef">
    <PanelHeader title="Pipeline" icon="pi pi-sitemap" :live="pipelineLoading" />
    <div class="panel__body panel__body--no-pad">
      <div class="pipeline-legend" v-if="hasPipelineData">
        <span class="pipeline-legend__mode font-mono">{{ sessionModeLabel }}</span>
        <span class="pipeline-legend__item"><i class="pipeline-legend__swatch pipeline-legend__swatch--depends"></i>Depends</span>
        <span class="pipeline-legend__item"><i class="pipeline-legend__swatch pipeline-legend__swatch--handoff"></i>Handoff</span>
        <span class="pipeline-legend__item"><i class="pipeline-legend__swatch pipeline-legend__swatch--spawn"></i>Spawn</span>
        <span class="pipeline-legend__item"><i class="pipeline-legend__swatch pipeline-legend__swatch--chain"></i>Chain</span>
      </div>

      <VChart
        v-if="hasPipelineData"
        :option="chartOption"
        :theme="'orket-dark'"
        @click="onGraphClick"
        autoresize
        style="width: 100%; height: 100%"
      />
      <EmptyState v-else message="No pipeline data" icon="pi pi-sitemap" />
    </div>

    <CardDetailDrawer v-model:visible="cardDrawerVisible" />

    <Dialog
      v-model:visible="edgeDialogVisible"
      modal
      header="Pipeline Edge"
      class="pipeline-edge-dialog"
      :style="{ width: '460px' }"
    >
      <div v-if="selectedEdge" class="edge-dialog">
        <div><strong>Kind:</strong> {{ selectedEdge.kind || 'depends_on' }}</div>
        <div><strong>From:</strong> {{ selectedEdge.source }}</div>
        <div><strong>To:</strong> {{ selectedEdge.target }}</div>
        <div v-if="selectedEdge.source_event"><strong>Source Event:</strong> {{ selectedEdge.source_event }}</div>
        <div v-if="selectedEdge.timestamp"><strong>Timestamp:</strong> {{ selectedEdge.timestamp }}</div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import PanelHeader from '@/layout/PanelHeader.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
import CardDetailDrawer from '@/components/cards/CardDetailDrawer.vue';
import { useBoardStore } from '@/stores/board.store';
import { useSessionStore } from '@/stores/session.store';
import { useCardsStore } from '@/stores/cards.store';
import { useEventsStore } from '@/stores/events.store';
import { useResizeObserver } from '@/composables/useResizeObserver';
import { computeDAGLayout, computeDAGLayoutFromGraph } from '@/utils/dag-layout';
import { buildSessionGraph } from '@/utils/session-graph';
import { statusHexColors } from '@/utils/colors';
import { truncate } from '@/utils/formatters';
import { sessionsApi } from '@/api/sessions.api';
import { logsApi } from '@/api/logs.api';
import type { CardStatus } from '@/types/cards';
import type { ExecutionEdgeKind, ExecutionGraph, ExecutionGraphEdge } from '@/types/sessions';
import type { EChartsOption } from 'echarts';

const board = useBoardStore();
const session = useSessionStore();
const cards = useCardsStore();
const events = useEventsStore();
const panelRef = ref<HTMLElement | null>(null);
const { width, height } = useResizeObserver(panelRef);
const executionGraph = ref<ExecutionGraph | null>(null);
const executionGraphCache = ref<Map<string, ExecutionGraph>>(new Map());
const graphLoading = ref(false);
const cardDrawerVisible = ref(false);
const edgeDialogVisible = ref(false);
const selectedEdge = ref<ExecutionGraphEdge | null>(null);

const pipelineLoading = computed(() => board.loading || graphLoading.value);
const sessionGraphV2Enabled = String(import.meta.env.VITE_PIPELINE_SESSION_GRAPH_V2 ?? 'true') !== 'false';

const activeGraph = computed(() => executionGraph.value);
const hasPipelineData = computed(() => {
  return (activeGraph.value?.nodes.length ?? 0) > 0 || board.allIssues.length > 0;
});

const sessionModeLabel = computed(() => {
  if (!sessionGraphV2Enabled) return 'Legacy Live Board';
  if (activeGraph.value?.nodes.length) {
    return `Session Replay ${activeGraph.value.session_id}`;
  }
  return 'Live Board Fallback';
});

watch(
  () => session.activeRun?.session_id,
  async (sessionId) => {
    if (!sessionId) {
      executionGraph.value = null;
      return;
    }
    await loadExecutionGraph(sessionId, true);
  },
  { immediate: true },
);

watch(
  () => events.buffer.length,
  async () => {
    const latest = events.buffer[events.buffer.length - 1];
    const sessionId = session.activeRun?.session_id;
    if (!latest || !sessionId) return;

    const shouldRefresh =
      latest.session_id === sessionId &&
      (latest.event === 'turn_complete' ||
        latest.event === 'turn_failed' ||
        latest.event === 'session_end');

    if (shouldRefresh) {
      await loadExecutionGraph(sessionId, true);
    }
  },
);

onMounted(async () => {
  // In case runs have not loaded yet and this panel mounts first.
  if (!session.activeRun) {
    await session.fetchRuns();
  }
  if (session.activeRun?.session_id) {
    await loadExecutionGraph(session.activeRun.session_id, true);
  }
});

async function loadExecutionGraph(sessionId: string, forceRefresh = false) {
  if (!sessionGraphV2Enabled) {
    executionGraph.value = null;
    return;
  }

  const cached = !forceRefresh ? executionGraphCache.value.get(sessionId) : undefined;
  if (cached) {
    executionGraph.value = cached;
    return;
  }

  graphLoading.value = true;
  try {
    const [baseGraph, logs] = await Promise.all([
      sessionsApi.getExecutionGraph(sessionId),
      logsApi.query({ session_id: sessionId, limit: 2000 }),
    ]);

    const enriched = buildSessionGraph(baseGraph, logs);
    executionGraph.value = enriched;
    executionGraphCache.value.set(sessionId, enriched);
  } catch {
    executionGraph.value = null;
  } finally {
    graphLoading.value = false;
  }
}

async function onGraphClick(event: unknown) {
  const e = event as {
    dataType?: string;
    data?: { id?: string; name?: string; source?: string; target?: string; kind?: string };
  };

  if (e.dataType === 'edge') {
    selectedEdge.value = {
      source: e.data?.source || '',
      target: e.data?.target || '',
      kind: (e.data?.kind || 'depends_on') as ExecutionEdgeKind,
    };
    edgeDialogVisible.value = true;
    return;
  }

  if (e.dataType === 'node') {
    const cardId = e.data?.id || e.data?.name;
    if (!cardId || cardId.startsWith('chain-')) return;

    try {
      await cards.selectCard(cardId);
      cardDrawerVisible.value = true;
    } catch {
      // Node may not map to a card id in some execution graph modes.
    }
  }
}

const chartOption = computed<EChartsOption>(() => {
  const w = width.value || 600;
  const h = height.value || 400;

  const hasExecutionNodes = (activeGraph.value?.nodes.length ?? 0) > 0;
  const { nodes, edges } = hasExecutionNodes
    ? computeDAGLayoutFromGraph(
        activeGraph.value!.nodes.map((node) => ({
          id: node.id,
          name: node.summary || node.id,
          status: node.status || 'unknown',
        })),
        activeGraph.value!.edges.map((edge) => ({
          source: edge.source,
          target: edge.target,
          kind: edge.kind || 'depends_on',
        })),
        w,
        h,
      )
    : computeDAGLayout(board.allIssues, w, h);

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const p = params as {
          dataType?: string;
          data?: { name?: string; status?: string; kind?: string };
        };

        if (p.dataType === 'edge') {
          return `Edge: ${p.data?.kind || 'depends_on'}`;
        }

        if (p.data?.name) return `${p.data.name}<br/>Status: ${p.data.status || 'unknown'}`;
        return '';
      },
    },
    series: [
      {
        type: 'graph',
        layout: 'none',
        coordinateSystem: undefined,
        data: nodes.map((n) => ({
          id: n.id,
          name: n.name,
          x: n.x,
          y: n.y,
          symbol: 'roundRect',
          symbolSize: [Math.min(120, w / 6), 36],
          itemStyle: nodeStyle(n.id, n.status as CardStatus),
          label: {
            show: true,
            formatter: truncate(n.name, 14),
            color: '#e8eaf0',
            fontSize: 10,
          },
          status: n.status,
        })),
        links: edges.map((e) => ({
          source: e.source,
          target: e.target,
          kind: (e.kind || 'depends_on') as ExecutionEdgeKind,
          lineStyle: {
            color:
              e.kind === 'handoff'
                ? '#00d4ff'
                : e.kind === 'spawn'
                  ? '#ffaa00'
                  : e.kind === 'parallel_chain'
                    ? '#00ff88'
                    : '#3a4560',
            width: e.kind === 'handoff' ? 2 : 1.5,
            type: e.kind === 'handoff' ? 'dashed' : 'solid',
            curveness: e.kind === 'parallel_chain' ? 0.28 : 0.15,
          },
        })),
        emphasis: {
          focus: 'adjacency',
          itemStyle: {
            borderColor: '#00d4ff',
            borderWidth: 2,
          },
        },
        lineStyle: { opacity: 0.6 },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: 8,
      },
    ],
  };
});

function nodeStyle(nodeId: string, status: CardStatus) {
  const isSynthetic = nodeId.startsWith('chain-');
  if (isSynthetic) {
    return {
      color: '#1f2635',
      borderColor: '#00d4ff',
      borderWidth: 1.5,
    };
  }

  return {
    color: statusHexColors[status] || '#4a5568',
    borderColor: '#2a3245',
    borderWidth: 1,
  };
}
</script>

<style scoped>
.pipeline-legend {
  display: flex;
  align-items: center;
  gap: var(--orket-space-md);
  padding: 6px var(--orket-space-sm);
  border-bottom: 1px solid var(--orket-border);
  background: var(--orket-bg-surface);
  font-size: var(--orket-font-size-xs);
  position: sticky;
  top: 0;
  z-index: 2;
}

.pipeline-legend__mode {
  color: var(--orket-accent-cyan);
  margin-right: auto;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.pipeline-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--orket-text-muted);
  white-space: nowrap;
}

.pipeline-legend__swatch {
  display: inline-block;
  width: 12px;
  height: 2px;
  border-radius: 2px;
  background: #3a4560;
}

.pipeline-legend__swatch--depends { background: #3a4560; }
.pipeline-legend__swatch--handoff { background: #00d4ff; }
.pipeline-legend__swatch--spawn { background: #ffaa00; }
.pipeline-legend__swatch--chain { background: #00ff88; }

.edge-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--orket-space-sm);
  font-size: var(--orket-font-size-sm);
}

.edge-dialog strong {
  color: var(--orket-text-primary);
}

:deep(.pipeline-edge-dialog.p-dialog) {
  background: var(--orket-bg-panel) !important;
  border: 1px solid var(--orket-border) !important;
}

:deep(.pipeline-edge-dialog .p-dialog-header) {
  background: var(--orket-bg-surface) !important;
  border-bottom: 1px solid var(--orket-border) !important;
}

:deep(.pipeline-edge-dialog .p-dialog-content) {
  background: var(--orket-bg-panel) !important;
  color: var(--orket-text-secondary) !important;
}
</style>
