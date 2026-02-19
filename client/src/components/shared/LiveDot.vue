<template>
  <span
    class="live-dot"
    :style="{
      background: color,
      boxShadow: `0 0 8px ${color}40`,
    }"
  ></span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ color?: string }>(), {
  color: 'var(--orket-accent-green)',
});
</script>

<style scoped>
.live-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: pulse-dot 2s ease-in-out infinite;
}
</style>
