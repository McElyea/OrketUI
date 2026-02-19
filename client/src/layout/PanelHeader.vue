<template>
  <div class="panel__header">
    <span class="panel-header__icon">
      <slot name="icon">
        <i :class="icon" v-if="icon"></i>
      </slot>
    </span>
    <span class="panel-header__title">{{ title }}</span>
    <span v-if="live" class="panel-header__live-dot"></span>
    <span class="panel-header__spacer"></span>
    <slot name="actions"></slot>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  icon?: string;
  live?: boolean;
}>();
</script>

<style scoped>
.panel-header__icon {
  font-size: var(--orket-font-size-sm);
  color: var(--orket-accent-cyan);
}

.panel-header__title {
  white-space: nowrap;
}

.panel-header__live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--orket-accent-green);
  box-shadow: var(--orket-glow-green);
  animation: pulse-dot 2s ease-in-out infinite;
}

.panel-header__spacer {
  flex: 1;
}
</style>
