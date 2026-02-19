import { defineStore } from 'pinia';
import { ref } from 'vue';
import { cardsApi } from '@/api/cards.api';
import type { Card, CardHistory, CardComment } from '@/types/cards';

export const useCardsStore = defineStore('cards', () => {
  const cache = ref<Map<string, Card>>(new Map());
  const selectedCard = ref<Card | null>(null);
  const selectedHistory = ref<CardHistory | null>(null);
  const selectedComments = ref<CardComment[]>([]);
  const loading = ref(false);

  async function fetchCard(cardId: string) {
    loading.value = true;
    try {
      const card = await cardsApi.get(cardId);
      cache.value.set(cardId, card);
      cache.value = new Map(cache.value); // trigger reactivity
      selectedCard.value = card;
    } finally {
      loading.value = false;
    }
  }

  async function fetchHistory(cardId: string) {
    try {
      selectedHistory.value = await cardsApi.history(cardId);
    } catch {
      selectedHistory.value = null;
    }
  }

  async function fetchComments(cardId: string) {
    try {
      selectedComments.value = await cardsApi.comments(cardId);
    } catch {
      selectedComments.value = [];
    }
  }

  async function selectCard(cardId: string) {
    await Promise.all([fetchCard(cardId), fetchHistory(cardId), fetchComments(cardId)]);
  }

  function clearSelection() {
    selectedCard.value = null;
    selectedHistory.value = null;
    selectedComments.value = [];
  }

  return {
    cache,
    selectedCard,
    selectedHistory,
    selectedComments,
    loading,
    fetchCard,
    selectCard,
    clearSelection,
  };
});
