import { create } from 'zustand';
import { AI_MODELS, type AIModel } from '@/types/ai';

interface AIModeState {
  selectedModel: AIModel;
  setModel: (model: AIModel) => void;
  isLocalAI: boolean;
  toggleAIMode: () => void;
}

export const useAIModeStore = create<AIModeState>((set) => ({
  selectedModel: AI_MODELS[0],
  isLocalAI: true,
  setModel: (model: AIModel) =>
    set({
      selectedModel: model,
      isLocalAI: model.type === 'local'
    }),
  toggleAIMode: () =>
    set((state) => {
      // Find the first model of the opposite type
      const newType = state.isLocalAI ? 'cloud' : 'local';
      const newModel = AI_MODELS.find(model => model.type === newType) || AI_MODELS[0];

      return {
        isLocalAI: !state.isLocalAI,
        selectedModel: newModel
      };
    }),
}));

