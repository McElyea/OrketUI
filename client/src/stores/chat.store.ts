import { defineStore } from 'pinia';
import { ref } from 'vue';
import { systemApi } from '@/api/system.api';

export interface ConsoleEntry {
  type: 'command' | 'response' | 'error' | 'system';
  content: string;
  timestamp: string;
}

export const useChatStore = defineStore('chat', () => {
  const history = ref<ConsoleEntry[]>([
    {
      type: 'system',
      content: 'Orket Operator Console v1.0\nType a command or describe what you want to do.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const loading = ref(false);
  const commandHistory = ref<string[]>([]);

  async function send(message: string) {
    // Record command
    history.value.push({
      type: 'command',
      content: message,
      timestamp: new Date().toISOString(),
    });
    commandHistory.value.push(message);

    loading.value = true;
    try {
      const response = await systemApi.chatDriver(message);
      history.value.push({
        type: 'response',
        content: response.response,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      history.value.push({
        type: 'error',
        content: e instanceof Error ? e.message : 'Command failed',
        timestamp: new Date().toISOString(),
      });
    } finally {
      loading.value = false;
    }
  }

  function clear() {
    history.value = [
      {
        type: 'system',
        content: 'Console cleared.',
        timestamp: new Date().toISOString(),
      },
    ];
  }

  return { history, loading, commandHistory, send, clear };
});
