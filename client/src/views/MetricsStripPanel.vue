<template>
  <div class="panel">
    <PanelHeader title="Metrics" icon="pi pi-chart-bar" :live="!!metrics.current" />
    <div class="panel__body panel__body--no-pad">
      <div class="metrics-strip" v-if="metrics.current">
        <div class="metrics-strip__gauges">
          <div class="gauge-card">
            <VChart :option="cpuGauge" :theme="'orket-dark'" autoresize class="gauge-chart" />
            <span class="gauge-card__label">CPU</span>
          </div>
          <div class="gauge-card">
            <VChart :option="ramGauge" :theme="'orket-dark'" autoresize class="gauge-chart" />
            <span class="gauge-card__label">RAM</span>
          </div>
          <div class="gauge-card">
            <VChart :option="vramGauge" :theme="'orket-dark'" autoresize class="gauge-chart" />
            <span class="gauge-card__label">VRAM</span>
          </div>
        </div>
        <div class="metrics-strip__chart">
          <VChart :option="throughputChart" :theme="'orket-dark'" autoresize style="width: 100%; height: 100%" />
        </div>
      </div>
      <EmptyState v-else message="No metrics data" icon="pi pi-chart-bar" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PanelHeader from '@/layout/PanelHeader.vue';
import EmptyState from '@/components/shared/EmptyState.vue';
import { useMetricsStore } from '@/stores/metrics.store';
import type { EChartsOption } from 'echarts';

const metrics = useMetricsStore();

function makeGauge(value: number, max: number, color: string): EChartsOption {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return {
    series: [
      {
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        radius: '90%',
        center: ['50%', '55%'],
        min: 0,
        max: 100,
        splitNumber: 4,
        pointer: { show: false },
        progress: {
          show: true,
          width: 10,
          roundCap: true,
          itemStyle: { color },
        },
        axisLine: {
          lineStyle: { width: 10, color: [[1, '#1a1f2e']] },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          formatter: `${Math.round(pct)}%`,
          fontSize: 14,
          fontFamily: 'JetBrains Mono, monospace',
          color: '#e8eaf0',
          offsetCenter: [0, '10%'],
        },
        data: [{ value: pct }],
      },
    ],
  };
}

const cpuGauge = computed(() =>
  makeGauge(metrics.current?.cpu_percent || 0, 100, '#00d4ff'),
);

const ramGauge = computed(() =>
  makeGauge(metrics.current?.ram_percent || 0, 100, '#00ff88'),
);

const vramGauge = computed(() => {
  const used = metrics.current?.vram_gb_used || 0;
  const total = metrics.current?.vram_total_gb || 1;
  return makeGauge(used, total, '#b388ff');
});

const throughputChart = computed<EChartsOption>(() => {
  const data = metrics.tokenHistory.map((d) => [d.timestamp, d.tokensPerSec]);
  return {
    grid: { top: 20, right: 10, bottom: 30, left: 45 },
    xAxis: {
      type: 'time',
      axisLabel: { fontSize: 9, color: '#8892a4' },
      axisLine: { lineStyle: { color: '#2a3245' } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'tok/s',
      nameTextStyle: { fontSize: 9, color: '#8892a4' },
      axisLabel: { fontSize: 9, color: '#8892a4' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#1a1f2e' } },
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const p = params as Array<{ value: [number, number] }>;
        if (p?.[0]?.value) {
          const [ts, val] = p[0].value;
          return `${new Date(ts).toLocaleTimeString()}<br/>${val.toFixed(1)} tok/s`;
        }
        return '';
      },
    },
    series: [
      {
        type: 'line',
        data,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#00d4ff', width: 1.5 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0,212,255,0.3)' },
              { offset: 1, color: 'rgba(0,212,255,0.02)' },
            ],
          } as unknown as string,
        },
      },
    ],
  };
});
</script>

<style scoped>
.metrics-strip {
  display: flex;
  height: 100%;
  gap: 1px;
  background: var(--orket-border);
}

.metrics-strip__gauges {
  display: flex;
  flex-direction: column;
  width: 120px;
  min-width: 100px;
  background: var(--orket-bg-panel);
}

.gauge-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2px;
  min-height: 0;
}

.gauge-chart {
  width: 100%;
  flex: 1;
  min-height: 0;
}

.gauge-card__label {
  font-family: var(--orket-font-mono);
  font-size: var(--orket-font-size-xs);
  color: var(--orket-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metrics-strip__chart {
  flex: 1;
  min-width: 0;
  background: var(--orket-bg-panel);
}
  .panel {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
</style>
