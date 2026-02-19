<template>
  <div class="panel">
    <PanelHeader title="Operator" icon="pi pi-terminal" :live="chat.loading">
      <template #actions>
        <button class="console-clear-btn" @click="chat.clear()" title="Clear console">
          <i class="pi pi-trash"></i>
        </button>
      </template>
    </PanelHeader>
    <div class="panel__body panel__body--no-pad">
      <div class="operator-console">
        <div class="operator-console__output" ref="outputRef">
          <div
            v-for="(entry, i) in chat.history"
            :key="i"
            class="console-entry"
            :class="`console-entry--${entry.type}`"
          >
            <template v-if="entry.type === 'command'">
              <span class="console-entry__prompt">orket&gt;</span>
              <span class="console-entry__text">{{ entry.content }}</span>
            </template>
            <template v-else-if="entry.type === 'response'">
              <pre class="console-entry__pre">{{ entry.content }}</pre>
            </template>
            <template v-else-if="entry.type === 'error'">
              <span class="console-entry__error">ERROR: {{ entry.content }}</span>
            </template>
            <template v-else>
              <span class="console-entry__system">{{ entry.content }}</span>
            </template>
          </div>
          <div v-if="chat.loading" class="console-entry console-entry--loading">
            <span class="console-spinner"></span>
            <span class="text-muted">Processing...</span>
          </div>
        </div>
        <div class="operator-console__input">
          <span class="input-prompt">orket&gt;</span>
          <input
            ref="inputRef"
            v-model="command"
            class="input-field"
            placeholder="Type a command..."
            @keydown.enter="sendCommand"
            @keydown.up.prevent="historyUp"
            @keydown.down.prevent="historyDown"
            :disabled="chat.loading"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import PanelHeader from '@/layout/PanelHeader.vue';
import { useChatStore } from '@/stores/chat.store';

const chat = useChatStore();
const command = ref('');
const outputRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const historyIndex = ref(-1);

async function sendCommand() {
  const msg = command.value.trim();
  if (!msg) return;
  command.value = '';
  historyIndex.value = -1;
  await chat.send(msg);
  await focusInput();
}

function historyUp() {
  if (chat.commandHistory.length === 0) return;
  if (historyIndex.value < chat.commandHistory.length - 1) {
    historyIndex.value++;
  }
  command.value = chat.commandHistory[chat.commandHistory.length - 1 - historyIndex.value];
}

function historyDown() {
  if (historyIndex.value > 0) {
    historyIndex.value--;
    command.value = chat.commandHistory[chat.commandHistory.length - 1 - historyIndex.value];
  } else {
    historyIndex.value = -1;
    command.value = '';
  }
}

async function focusInput() {
  await nextTick();
  inputRef.value?.focus();
}

onMounted(() => {
  void focusInput();
});

// Auto-scroll output
watch(
  () => chat.history.length,
  async () => {
    await nextTick();
    if (outputRef.value) {
      outputRef.value.scrollTop = outputRef.value.scrollHeight;
    }
  },
);

watch(
  () => chat.loading,
  async (isLoading) => {
    if (!isLoading) {
      await focusInput();
    }
  },
);
</script>



<style scoped>
.panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.operator-console {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--orket-bg-base);
}

.operator-console__output {
  flex: 1;
  overflow-y: auto;
  padding: var(--orket-space-md);
  font-family: var(--orket-font-mono);
  font-size: var(--orket-font-size-xs);
  line-height: 1.6;
}

.console-entry {
  margin-bottom: var(--orket-space-xs);
}

.console-entry--command {
  color: var(--orket-text-primary);
}

.console-entry__prompt {
  color: var(--orket-accent-cyan);
  margin-right: var(--orket-space-sm);
  user-select: none;
}

.console-entry__text {
  color: var(--orket-text-primary);
}

.console-entry__pre {
  margin: var(--orket-space-xs) 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--orket-text-secondary);
  padding: var(--orket-space-sm);
  background: var(--orket-bg-panel);
  border-radius: var(--orket-radius-sm);
  border-left: 2px solid var(--orket-border-active);
}

.console-entry__error {
  color: var(--orket-accent-red);
}

.console-entry__system {
  color: var(--orket-text-muted);
  font-style: italic;
}

.console-entry--loading {
  display: flex;
  align-items: center;
  gap: var(--orket-space-sm);
}

.console-spinner {
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 1.5px solid var(--orket-accent-cyan);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.operator-console__input {
  display: flex;
  align-items: center;
  padding: var(--orket-space-sm) var(--orket-space-md);
  border-top: 1px solid var(--orket-border);
  background: var(--orket-bg-panel);
}

.input-prompt {
  color: var(--orket-accent-cyan);
  font-family: var(--orket-font-mono);
  font-size: var(--orket-font-size-xs);
  margin-right: var(--orket-space-sm);
  user-select: none;
  flex-shrink: 0;
}

.input-field {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--orket-text-primary);
  font-family: var(--orket-font-mono);
  font-size: var(--orket-font-size-xs);
  caret-color: var(--orket-accent-cyan);
}

.input-field::placeholder {
  color: var(--orket-text-muted);
}

.input-field:disabled {
  opacity: 0.4;
}
</style>
