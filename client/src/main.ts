import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Tooltip from 'primevue/tooltip';
import { orketPreset } from '@/assets/styles/theme-preset';
import '@/utils/echarts-theme';
import App from './App.vue';
import '@/assets/styles/main.css';
import 'primeicons/primeicons.css';

// ECharts tree-shaken imports
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { GaugeChart, LineChart, GraphChart, BarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';

use([
  CanvasRenderer,
  GaugeChart,
  LineChart,
  GraphChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
]);

const app = createApp(App);

app.use(createPinia());
app.use(PrimeVue, {
  theme: {
    preset: orketPreset,
    options: {
      darkModeSelector: '.orket-dark',
      cssLayer: false,
    },
  },
});
app.directive('tooltip', Tooltip);
app.component('VChart', VChart);

app.mount('#app');
