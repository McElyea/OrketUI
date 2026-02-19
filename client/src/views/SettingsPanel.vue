<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    header="Runtime Settings"
    modal
    :style="{ width: '550px', maxHeight: '80vh' }"
    :breakpoints="{ '768px': '95vw' }"
  >
    <div v-if="settings.loading" class="settings-loading">
      <i class="pi pi-spin pi-spinner" style="font-size: 1.2rem"></i>
      <span class="text-muted">Loading settings...</span>
    </div>
    <div v-else class="settings-form">
      <div
        v-for="(option, key) in settings.policyOptions"
        :key="key"
        class="setting-row"
      >
        <div class="setting-row__label">
          <span class="setting-row__name">{{ formatKey(String(key)) }}</span>
          <span class="setting-row__env text-muted font-mono text-xs">{{ option.env_var }}</span>
        </div>
        <div class="setting-row__control">
          <template v-if="option.type === 'bool'">
            <button
              class="setting-toggle"
              :class="{ 'setting-toggle--on': policyValue(String(key)) === true }"
              @click="toggleBool(String(key))"
            >
              {{ policyValue(String(key)) ? 'ON' : 'OFF' }}
            </button>
          </template>
          <template v-else-if="option.aliases && option.aliases.length > 0">
            <select
              class="setting-select"
              :value="policyValue(String(key)) ?? ''"
              @change="updateField(String(key), ($event.target as HTMLSelectElement).value)"
            >
              <option value="">Default</option>
              <option v-for="alias in option.aliases" :key="alias" :value="alias">{{ alias }}</option>
            </select>
          </template>
          <template v-else>
            <input
              class="setting-input"
              :value="policyValue(String(key)) ?? ''"
              @change="updateField(String(key), ($event.target as HTMLInputElement).value)"
              :placeholder="option.type"
            />
          </template>
        </div>
      </div>

      <div v-if="Object.keys(settings.policyOptions).length === 0" class="text-muted text-center" style="padding: 2rem">
        No configurable policy options available.
      </div>
    </div>

    <template #footer>
      <div class="settings-footer">
        <span v-if="saving" class="text-muted text-xs">
          <i class="pi pi-spin pi-spinner"></i> Saving...
        </span>
        <span v-if="saved" class="text-xs" style="color: var(--orket-accent-green)">
          <i class="pi pi-check"></i> Saved
        </span>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import { useSettingsStore } from '@/stores/settings.store';

const props = defineProps<{ visible: boolean }>();
defineEmits<{ 'update:visible': [value: boolean] }>();

const settings = useSettingsStore();
const saving = ref(false);
const saved = ref(false);

// Load settings when modal opens
watch(
  () => props.visible,
  (val) => {
    if (val) {
      settings.fetchAll();
      saved.value = false;
    }
  },
);

function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function policyValue(key: string): unknown {
  return (settings.policy as Record<string, unknown>)[key];
}

async function updateField(key: string, value: string) {
  saving.value = true;
  saved.value = false;
  try {
    await settings.updatePolicy({ [key]: value || undefined });
    saved.value = true;
  } finally {
    saving.value = false;
    setTimeout(() => { saved.value = false; }, 2000);
  }
}

async function toggleBool(key: string) {
  const current = policyValue(key);
  await updateField(key, current ? '' : 'true');
}
</script>

<style scoped>
.settings-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--orket-space-md);
  padding: 2rem;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--orket-border);
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--orket-space-md) var(--orket-space-lg);
  background: var(--orket-bg-panel);
  gap: var(--orket-space-lg);
}

.setting-row__label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-row__name {
  font-size: var(--orket-font-size-sm);
  color: var(--orket-text-primary);
}

.setting-row__env {
  font-size: 10px;
}

.setting-row__control {
  flex-shrink: 0;
}

.setting-select,
.setting-input {
  padding: 4px 8px;
  background: var(--orket-bg-surface);
  border: 1px solid var(--orket-border);
  border-radius: var(--orket-radius-sm);
  color: var(--orket-text-primary);
  font-family: var(--orket-font-mono);
  font-size: var(--orket-font-size-xs);
  min-width: 150px;
}

.setting-select:focus,
.setting-input:focus {
  border-color: var(--orket-accent-cyan);
  outline: none;
}

.setting-toggle {
  padding: 4px 12px;
  border: 1px solid var(--orket-border);
  border-radius: var(--orket-radius-sm);
  background: var(--orket-bg-surface);
  color: var(--orket-text-muted);
  font-family: var(--orket-font-mono);
  font-size: var(--orket-font-size-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--orket-transition-fast);
}

.setting-toggle--on {
  background: rgba(0, 255, 136, 0.15);
  border-color: var(--orket-accent-green);
  color: var(--orket-accent-green);
}

.settings-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--orket-space-md);
}
</style>
