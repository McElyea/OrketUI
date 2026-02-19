<template>
  <div class="topbar">
    <div class="topbar__left">
      <span class="topbar__logo">ORKET</span>
      <span class="topbar__separator">|</span>
      <span class="topbar__label">MISSION CONTROL</span>
    </div>

    <div class="topbar__center">
      <template v-if="session.activeRun">
        <span class="topbar__run-label">
          <span class="topbar__run-dot" :class="`topbar__run-dot--${session.activeRun.status}`"></span>
          Run {{ shortId(session.activeRun.session_id) }}
        </span>
        <span class="topbar__run-status">{{ session.activeRun.status }}</span>
      </template>
      <span v-else class="topbar__run-label text-muted">No active run</span>
    </div>

    <div class="topbar__right">
      <button
        class="topbar__btn topbar__btn--primary"
        @click="handleStart"
        :disabled="session.activeRun?.status === 'running'"
      >
        <i class="pi pi-play"></i> Start
      </button>
      <button
        class="topbar__btn topbar__btn--danger"
        @click="session.haltRun()"
        :disabled="session.activeRun?.status !== 'running'"
      >
        <i class="pi pi-stop"></i> Stop
      </button>
      <button class="topbar__btn" @click="showHistory = true">
        <i class="pi pi-history"></i> History
      </button>
      <button class="topbar__btn" @click="showSettings = true">
        <i class="pi pi-cog"></i> Settings
      </button>
      <span class="topbar__connection" :class="`topbar__connection--${wsStatus}`">
        <span class="topbar__connection-dot"></span>
        {{ wsStatus }}
      </span>
    </div>
  </div>

  <Teleport to="body">
    <RunHistoryPanel v-model:visible="showHistory" />
    <SettingsPanel v-model:visible="showSettings" />
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSessionStore } from '@/stores/session.store';
import { shortId } from '@/utils/formatters';
import RunHistoryPanel from '@/views/RunHistoryPanel.vue';
import SettingsPanel from '@/views/SettingsPanel.vue';

defineProps<{
  wsStatus: 'connecting' | 'connected' | 'disconnected';
}>();

const session = useSessionStore();
const showHistory = ref(false);
const showSettings = ref(false);

async function handleStart() {
  await session.startRun();
}
</script>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  height: 40px;
  min-height: 40px;
  max-height: 40px;
  padding: 0 var(--orket-space-xl);
  background: var(--orket-bg-surface);
  border-bottom: 1px solid var(--orket-border);
  gap: var(--orket-space-lg);
  flex-shrink: 0;
}

.topbar__left {
  display: flex;
  align-items: center;
  gap: var(--orket-space-md);
  flex-shrink: 0;
}

.topbar__logo {
  font-family: var(--orket-font-mono);
  font-size: var(--orket-font-size-lg);
  font-weight: 700;
  color: var(--orket-accent-cyan);
  letter-spacing: 0.15em;
  text-shadow: var(--orket-glow-cyan);
}

.topbar__separator {
  color: var(--orket-border-active);
}

.topbar__label {
  font-size: var(--orket-font-size-xs);
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--orket-text-secondary);
}

.topbar__center {
  flex: 1;
  min-width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--orket-space-md);
  overflow: hidden;
}

.topbar__run-label {
  font-family: var(--orket-font-mono);
  font-size: var(--orket-font-size-sm);
  color: var(--orket-text-primary);
  display: flex;
  align-items: center;
  gap: var(--orket-space-sm);
}

.topbar__run-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--orket-text-muted);
}

.topbar__run-dot--running {
  background: var(--orket-accent-green);
  box-shadow: var(--orket-glow-green);
  animation: pulse-dot 1.5s ease-in-out infinite;
}

.topbar__run-dot--completed { background: var(--orket-accent-green); }
.topbar__run-dot--failed { background: var(--orket-accent-red); }
.topbar__run-dot--halted { background: var(--orket-accent-amber); }

.topbar__run-status {
  font-size: var(--orket-font-size-xs);
  text-transform: uppercase;
  color: var(--orket-text-secondary);
}

.topbar__right {
  display: flex;
  align-items: center;
  gap: var(--orket-space-md);
  flex-shrink: 0;
}

.topbar__btn {
  display: flex;
  align-items: center;
  gap: var(--orket-space-sm);
  padding: 4px 10px;
  border: 1px solid var(--orket-border);
  border-radius: var(--orket-radius-sm);
  background: transparent;
  color: var(--orket-text-secondary);
  font-family: var(--orket-font-display);
  font-size: var(--orket-font-size-xs);
  cursor: pointer;
  transition: color var(--orket-transition-fast),
    border-color var(--orket-transition-fast),
    background var(--orket-transition-fast),
    opacity var(--orket-transition-fast);
}

.topbar__btn:hover:not(:disabled) {
  color: var(--orket-text-primary);
  border-color: var(--orket-border-active);
  background: var(--orket-bg-elevated);
}

.topbar__btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.topbar__btn--primary:hover:not(:disabled) {
  color: var(--orket-accent-green);
  border-color: var(--orket-accent-green);
}

.topbar__btn--danger:hover:not(:disabled) {
  color: var(--orket-accent-red);
  border-color: var(--orket-accent-red);
}

.topbar__connection {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--orket-space-sm);
  font-size: var(--orket-font-size-xs);
  font-family: var(--orket-font-mono);
  text-transform: uppercase;
  width: 110px;
}

.topbar__connection--connected { color: var(--orket-accent-green); }
.topbar__connection--connecting { color: var(--orket-accent-amber); }
.topbar__connection--disconnected { color: var(--orket-accent-red); }

.topbar__connection-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.topbar__connection--connected .topbar__connection-dot {
  box-shadow: var(--orket-glow-green);
}
</style>
