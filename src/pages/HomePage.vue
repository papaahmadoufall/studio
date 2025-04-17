<template>
  <div class="home-container">
    <!-- Existing content -->
    
    <div class="ai-mode-switch">
      <v-switch
        v-model="isLocalAI"
        :label="isLocalAI ? 'Using Local AI (Gemma 3B)' : 'Using Cloud AI'"
        @change="handleAIModeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAIModeStore } from '@/stores/aiModeStore';
import { storeToRefs } from 'pinia';
import { ollamaService } from '@/services/ollamaService';

const aiModeStore = useAIModeStore();
const { isLocalAI } = storeToRefs(aiModeStore);

const handleAIModeChange = () => {
  aiModeStore.toggleAIMode();
};

// Modify your existing AI call function to use the selected mode
const processWithAI = async (prompt: string) => {
  try {
    if (isLocalAI.value) {
      // Use local Ollama
      return await ollamaService.generateResponse(prompt);
    } else {
      // Use your existing cloud AI implementation
      // return await yourExistingAIService.generate(prompt);
    }
  } catch (error) {
    console.error('AI processing error:', error);
    throw error;
  }
};
</script>

<style scoped>
.ai-mode-switch {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100;
}
</style>