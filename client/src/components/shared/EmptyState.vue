<template>
  <div class="empty-state">
    <i :class="icon" class="empty-state__icon" v-if="icon"></i>
    <div class="empty-state__text">{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ message?: string; icon?: string }>(), {
  message: 'No data available',
  icon: 'pi pi-inbox',
});
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: var(--orket-space-md);
  color: var(--orket-text-muted);
}

.empty-state__icon {
  font-size: 1.5rem;
  opacity: 0.4;
}

.empty-state__text {
  font-size: var(--orket-font-size-sm);
}
</style>
