import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false);
  const loading = ref(true);

  async function checkSession() {
    loading.value = true;
    try {
      const res = await fetch('/bff/me', { credentials: 'include' });
      const data = await res.json();
      isAuthenticated.value = data.authenticated === true;
    } catch {
      isAuthenticated.value = false;
    } finally {
      loading.value = false;
    }
  }

  async function login(password: string): Promise<boolean> {
    try {
      const res = await fetch('/bff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        isAuthenticated.value = true;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async function logout() {
    await fetch('/bff/logout', { method: 'POST', credentials: 'include' });
    isAuthenticated.value = false;
  }

  return { isAuthenticated, loading, checkSession, login, logout };
});
