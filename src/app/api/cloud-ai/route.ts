import { NextResponse } from 'next/server';
import { ai } from '@/ai/ai-instance';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body;

    console.log('Attempting to use cloud AI with prompt:', prompt);

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_GENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Google Gemini API key is not configured' },
        { status: 500 }
      );
    }

    try {
      const result = await ai.generate(prompt);
      console.log('Received response from Google AI');
      
      // Extract text content from the response
      let responseText = '';
      if (result && typeof result === 'object' && 'text' in result) {
        responseText = result.text;
      } else if (result && typeof result === 'string') {
        responseText = result;
      } else {
        responseText = JSON.stringify(result);
      }

      return NextResponse.json({
        response: responseText,
        model: 'googleai/gemini-2.0-flash'
      });
    } catch (aiError: any) {
      console.error('Google AI error:', aiError);
      return NextResponse.json(
        { 
          error: 'Failed to get response from Google AI',
          details: aiError.message 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
