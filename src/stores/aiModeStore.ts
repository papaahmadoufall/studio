import { create } from 'zustand';

interface AIModeState {
  isLocalAI: boolean;
  toggleAIMode: () => void;
}

export const useAIModeStore = create<AIModeState>((set) => ({
  isLocalAI: false,
  toggleAIMode: () => set((state) => ({ isLocalAI: !state.isLocalAI })),
}));
