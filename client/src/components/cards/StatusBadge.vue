<template>
  <span class="status-badge" :style="{ background: bgColor, color: textColor }">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CardStatus } from '@/types/cards';
import { statusColors, statusLabels, statusHexColors } from '@/utils/colors';

const props = defineProps<{ status: CardStatus }>();

const label = computed(() => statusLabels[props.status] || props.status);
const textColor = computed(() => statusColors[props.status] || 'var(--orket-text-secondary)');
const bgColor = computed(() => {
  const hex = statusHexColors[props.status] || '#4a5568';
  return hex + '20'; // 12% opacity
});
</script>

<style scoped>
.status-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: var(--orket-radius-sm);
  font-size: var(--orket-font-size-xs);
  font-weight: 600;
  white-space: nowrap;
  line-height: 1.4;
}
</style>
