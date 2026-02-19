<template>
  <div class="orket-dark">
    <LoginScreen v-if="!auth.isAuthenticated" />
    <CommandCenter v-else />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import LoginScreen from '@/views/LoginScreen.vue';
import CommandCenter from '@/layout/CommandCenter.vue';

const auth = useAuthStore();
onMounted(() => auth.checkSession());
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100vh;
  width: 100vw;
}
</style>
