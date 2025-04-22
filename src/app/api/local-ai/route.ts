import { NextResponse } from 'next/server';
import axios from 'axios';

const OLLAMA_BASE_URL = 'http://localhost:11434';
const TIMEOUT_MS = 300000; // 5 minutes timeout for long-running AI tasks

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, model } = body;

    console.log('Attempting to use local AI model:', model);

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!model) {
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 }
      );
    }

    // First check if Ollama is running and the model is available
    try {
      const tagsResponse = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
        timeout: 5000 // 5 second timeout for checking availability
      });

      const availableModels = tagsResponse.data.models || [];
      const modelNames = availableModels.map((m: any) => m.name);

      console.log('Available Ollama models:', modelNames);

      if (!modelNames.includes(model)) {
        console.warn(`Model ${model} not found in available models: ${modelNames.join(', ')}`);
        // We'll still try to use it, as it might be downloading or not listed correctly
      }
    } catch (checkError: any) {
      console.error('Error checking Ollama availability:', checkError.message);
      return NextResponse.json(
        {
          error: 'Ollama is not running or not accessible',
          details: checkError.message
        },
        { status: 503 } // Service Unavailable
      );
    }

    console.log('Sending request to Ollama:', {
      url: `${OLLAMA_BASE_URL}/api/generate`,
      model,
      promptLength: prompt.length
    });

    try {
      const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
        model: model,
        prompt: prompt,
        stream: false
      }, {
        timeout: TIMEOUT_MS
      });

      console.log('Received response from Ollama');

      return NextResponse.json({
        response: response.data.response,
        model: model
      });
    } catch (generateError: any) {
      // Handle specific Ollama errors
      if (generateError.response?.data?.error) {
        const ollamaError = generateError.response.data.error;
        console.error('Ollama generate error:', ollamaError);

        // Check for common error patterns
        if (ollamaError.includes('model') && ollamaError.includes('not found')) {
          return NextResponse.json(
            {
              error: `Model '${model}' not found. Please pull it first with 'ollama pull ${model}'`,
              details: ollamaError
            },
            { status: 404 } // Not Found
          );
        }

        return NextResponse.json(
          {
            error: 'Ollama generation failed',
            details: ollamaError
          },
          { status: 500 }
        );
      }

      // Handle timeout errors
      if (generateError.code === 'ECONNABORTED') {
        return NextResponse.json(
          {
            error: 'Ollama request timed out',
            details: 'The request took too long to complete. Try with a shorter prompt or a smaller model.'
          },
          { status: 504 } // Gateway Timeout
        );
      }

      // Handle connection errors
      if (generateError.code === 'ECONNREFUSED') {
        return NextResponse.json(
          {
            error: 'Could not connect to Ollama',
            details: 'Make sure Ollama is running on your machine.'
          },
          { status: 503 } // Service Unavailable
        );
      }

      // Generic error fallback
      console.error('Unexpected Ollama error:', generateError.message);
      return NextResponse.json(
        {
          error: 'Failed to get response from Ollama',
          details: generateError.message
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Local AI API route error:', error.message);
    return NextResponse.json(
      {
        error: 'Failed to process local AI request',
        details: error.message
      },
      { status: 500 }
    );
  }
}

