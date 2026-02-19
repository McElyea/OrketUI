<template>
  <div class="login">
    <div class="login__card">
      <div class="login__logo">ORKET</div>
      <div class="login__subtitle">MISSION CONTROL</div>
      <form @submit.prevent="handleLogin" class="login__form">
        <input
          v-model="password"
          type="password"
          class="login__input"
          placeholder="Enter access code"
          autofocus
          :disabled="loading"
        />
        <button class="login__btn" type="submit" :disabled="loading || !password">
          {{ loading ? 'Authenticating...' : 'Access' }}
        </button>
        <div v-if="errorMsg" class="login__error">{{ errorMsg }}</div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth.store';

const auth = useAuthStore();
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

async function handleLogin() {
  loading.value = true;
  errorMsg.value = '';
  const success = await auth.login(password.value);
  if (!success) {
    errorMsg.value = 'Access denied';
  }
  loading.value = false;
}
</script>

<style scoped>
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background: var(--orket-bg-base);
}

.login__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--orket-space-lg);
  padding: 48px 40px;
  background: var(--orket-bg-panel);
  border: 1px solid var(--orket-border);
  border-radius: var(--orket-radius-lg);
}

.login__logo {
  font-family: var(--orket-font-mono);
  font-size: 2rem;
  font-weight: 700;
  color: var(--orket-accent-cyan);
  letter-spacing: 0.2em;
  text-shadow: var(--orket-glow-cyan);
}

.login__subtitle {
  font-size: var(--orket-font-size-xs);
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--orket-text-muted);
  margin-top: -8px;
}

.login__form {
  display: flex;
  flex-direction: column;
  gap: var(--orket-space-lg);
  width: 280px;
  margin-top: var(--orket-space-xl);
}

.login__input {
  padding: 10px 14px;
  background: var(--orket-bg-surface);
  border: 1px solid var(--orket-border);
  border-radius: var(--orket-radius-sm);
  color: var(--orket-text-primary);
  font-family: var(--orket-font-mono);
  font-size: var(--orket-font-size-md);
  outline: none;
  transition: border-color var(--orket-transition-fast);
}

.login__input:focus {
  border-color: var(--orket-accent-cyan);
  box-shadow: var(--orket-glow-cyan);
}

.login__btn {
  padding: 10px;
  background: transparent;
  border: 1px solid var(--orket-accent-cyan);
  border-radius: var(--orket-radius-sm);
  color: var(--orket-accent-cyan);
  font-family: var(--orket-font-mono);
  font-size: var(--orket-font-size-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all var(--orket-transition-fast);
}

.login__btn:hover:not(:disabled) {
  background: rgba(0, 212, 255, 0.1);
  box-shadow: var(--orket-glow-cyan);
}

.login__btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.login__error {
  text-align: center;
  font-size: var(--orket-font-size-sm);
  color: var(--orket-accent-red);
}
</style>
