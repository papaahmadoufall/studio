import { NextResponse } from 'next/server';
import axios from 'axios';

const OLLAMA_BASE_URL = 'http://localhost:11434';

export async function GET() {
  try {
    // Try to connect to Ollama API
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 3000 // 3 second timeout
    });

    // Extract model information
    const models = response.data.models || [];
    const modelNames = models.map((model: any) => model.name);

    // Check if we have any of our configured models available
    const requiredModels = ['gemma3', 'qwen2.5-coder', 'deepseek-r1:14b', 'mistral'];
    const availableRequiredModels = requiredModels.filter(model => modelNames.includes(model));
    const missingModels = requiredModels.filter(model => !modelNames.includes(model));

    // If we get here, Ollama is running
    return NextResponse.json({
      status: 'online',
      models: modelNames,
      availableRequiredModels,
      missingModels,
      defaultModel: availableRequiredModels.length > 0 ? availableRequiredModels[0] : null,
      installCommand: missingModels.length > 0 ?
        `ollama pull ${missingModels[0]}` :
        null
    });
  } catch (error: any) {
    // Check for specific error types
    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json({
        status: 'offline',
        error: 'Failed to connect to Ollama. Make sure it is running on your machine.',
        installInstructions: 'Visit https://ollama.com to download and install Ollama.'
      }, { status: 503 }); // Service Unavailable
    }

    console.error('Ollama connection error:', error.message);
    return NextResponse.json({
      status: 'offline',
      error: `Failed to connect to Ollama: ${error.message}`,
      details: error.response?.data || null
    }, { status: 503 }); // Service Unavailable
  }
}
