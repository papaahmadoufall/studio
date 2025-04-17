import axios from 'axios';

const OLLAMA_BASE_URL = 'http://localhost:11434';

export class OllamaService {
  async generateResponse(prompt: string) {
    try {
      const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
        model: 'gemma:3b',
        prompt: prompt,
        stream: false
      });
      
      return response.data.response;
    } catch (error) {
      console.error('Error calling Ollama:', error);
      throw new Error('Failed to get response from local AI');
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
