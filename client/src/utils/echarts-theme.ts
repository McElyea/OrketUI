import { registerTheme } from 'echarts/core';

registerTheme('orket-dark', {
  backgroundColor: 'transparent',
  textStyle: {
    color: '#8892a4',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  title: {
    textStyle: { color: '#e8eaf0' },
  },
  line: {
    itemStyle: { borderWidth: 2 },
    lineStyle: { width: 2 },
    symbolSize: 0,
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#2a3245' } },
    splitLine: { lineStyle: { color: '#1a1f2e' } },
    axisLabel: { color: '#8892a4' },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: '#2a3245' } },
    splitLine: { lineStyle: { color: '#1a1f2e' } },
    axisLabel: { color: '#8892a4' },
  },
  graph: {
    color: ['#00d4ff', '#00ff88', '#ffaa00', '#b388ff', '#ff4455', '#448aff'],
  },
  gauge: {
    axisLine: {
      lineStyle: {
        color: [
          [0.6, '#00ff88'],
          [0.85, '#ffaa00'],
          [1, '#ff4455'],
        ],
      },
    },
  },
  color: ['#00d4ff', '#00ff88', '#ffaa00', '#b388ff', '#ff4455', '#448aff'],
});
