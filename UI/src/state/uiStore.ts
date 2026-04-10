import { create } from "zustand";

interface UIState {
  railCollapsed: boolean;
  selectedCardId?: string;
  selectedRunId?: string;
  selectedInspectorTarget?: string;
  selectedSequencerNodeId?: string;
  setRailCollapsed(next: boolean): void;
  toggleRail(): void;
  setSelectedCardId(cardId?: string): void;
  setSelectedRunId(sessionId?: string): void;
  setSelectedInspectorTarget(target?: string): void;
  setSelectedSequencerNodeId(nodeId?: string): void;
}

export const useUIStore = create<UIState>((set) => ({
  railCollapsed: false,
  selectedCardId: undefined,
  selectedRunId: undefined,
  selectedInspectorTarget: undefined,
  selectedSequencerNodeId: undefined,
  setRailCollapsed: (next) => set({ railCollapsed: next }),
  toggleRail: () => set((state) => ({ railCollapsed: !state.railCollapsed })),
  setSelectedCardId: (cardId) => set({ selectedCardId: cardId }),
  setSelectedRunId: (sessionId) => set({ selectedRunId: sessionId }),
  setSelectedInspectorTarget: (target) => set({ selectedInspectorTarget: target }),
  setSelectedSequencerNodeId: (nodeId) => set({ selectedSequencerNodeId: nodeId }),
}));
