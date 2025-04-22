import axios from 'axios';
import { useAIModeStore } from '@/stores/aiModeStore';

const OLLAMA_BASE_URL = 'http://localhost:11434';

export class OllamaService {
  async generateResponse(prompt: string, modelId?: string) {
    try {
      // Get the selected model from the store if not provided
      const model = modelId || useAIModeStore.getState().selectedModel.id;

      console.log(`Sending request to Ollama with model: ${model}`);

      const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
        model: model,
        prompt: prompt,
        stream: false
      });

      return response.data.response;
    } catch (error: any) {
      console.error('Error calling Ollama:', error.response?.data || error.message);
      throw new Error(`Failed to get response from local AI: ${error.response?.data?.error || error.message}`);
    }
  }

  async processThematicAnalysis(texts: string[]) {
    const prompt = `Analyze the following responses and identify common themes:
    ${texts.join('\n')}`;
    return this.generateResponse(prompt);
  }

  async processSentimentAnalysis(text: string) {
    const prompt = `Analyze the sentiment of this text and provide a score between -1 and 1:
    ${text}`;
    return this.generateResponse(prompt);
  }
}

export const ollamaService = new OllamaService();
