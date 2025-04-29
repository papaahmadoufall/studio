export type AIModel = {
  id: string;
  name: string;
  type: 'local' | 'cloud';
};

export const AI_MODELS: AIModel[] = [
  { id: 'qwen2.5-coder', name: 'Qwen 2.5 Coder', type: 'local' },
  { id: 'gemma3', name: 'Gemma 3', type: 'local' },
  { id: 'deepseek-r1:14b', name: 'DeepSeek R1 14B', type: 'local' },
  { id: 'mistral', name: 'Mistral', type: 'local' },
  { id: 'googleai/gemini-2.0-flash', name: 'Gemini', type: 'cloud' },
];
