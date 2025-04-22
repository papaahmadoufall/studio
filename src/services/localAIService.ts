// Local AI service that uses the local-ai API route to process requests
import { useAIModeStore } from '@/stores/aiModeStore';
import { safeJsonParse } from '@/utils/json-parser';

export class LocalAIService {
  async detectKpis(surveyData: any[]) {
    try {
      const { selectedModel } = useAIModeStore.getState();

      // Use more data for better analysis
      const surveyDataSample = surveyData.slice(0, 5);

      // Extract column names for better analysis
      const columnNames = surveyData.length > 0 ? Object.keys(surveyData[0]) : [];
      const numericColumns = columnNames.filter(col => {
        return surveyData.some(row => typeof row[col] === 'number' || !isNaN(Number(row[col])));
      });

      const prompt = `
Analyze this survey data and identify the key performance indicators (KPIs).

A KPI is a numerical metric that strongly influences overall satisfaction or performance.
Focus on numerical columns that show patterns or correlations with other metrics.

Survey columns: ${columnNames.join(', ')}
Numerical columns: ${numericColumns.join(', ')}

Survey Data Sample:
${JSON.stringify(surveyDataSample, null, 2)}

Identify 3-5 most important numerical metrics that would be considered KPIs.
Do NOT include demographic data like 'age' unless it's truly a performance indicator.
Prefer columns with ratings, scores, or metrics that measure performance or satisfaction.

RETURN ONLY THIS JSON FORMAT WITHOUT ANY OTHER TEXT OR FORMATTING:
{
  "kpis": ["column1", "column2", "column3"],
  "explanation": "Brief explanation of why these are important KPIs"
}
`;

      const response = await fetch('/api/local-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: selectedModel.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get KPI detection response');
      }

      // Try to parse the response as JSON using our safe parser
      const jsonResponse = safeJsonParse(data.response);

      if (jsonResponse && jsonResponse.kpis) {
        return {
          kpis: Array.isArray(jsonResponse.kpis) ? jsonResponse.kpis : [],
          explanation: jsonResponse.explanation || ''
        };
      }

      // If parsing fails or the response doesn't have the expected structure,
      // try to extract the information from the text
      console.warn('Failed to parse KPI response as JSON, attempting to extract from text');

      // Look for KPIs in the text - try different patterns
      let kpis: string[] = [];

      // Try to find a list of KPIs
      const kpiListMatch = data.response.match(/KPIs?:?[\s\n]*((?:-|\*|\d+\.)\s*[\w\s]+[\n\r]*)+/i);
      if (kpiListMatch && kpiListMatch[1]) {
        const kpiListText = kpiListMatch[1];
        const kpiItems = kpiListText.match(/(?:-|\*|\d+\.)\s*([\w\s]+)/g);
        if (kpiItems) {
          kpis = kpiItems.map(item => item.replace(/(?:-|\*|\d+\.)\s*/, '').trim());
        }
      }

      // If we couldn't find a list, try to find KPIs mentioned in the text
      if (kpis.length === 0) {
        const kpisMatch = data.response.match(/kpis"?\s*:?\s*\[(.*?)\]/i);
        if (kpisMatch && kpisMatch[1]) {
          kpis = kpisMatch[1].split(',').map(k => k.trim().replace(/"/g, ''));
        }
      }

      // If we still couldn't find KPIs, look for any words that might be KPIs
      if (kpis.length === 0) {
        const potentialKpis = data.response.match(/(?:key|important|significant)\s+(?:indicators?|metrics?|KPIs?|factors?)\s+(?:are|is|include)\s+([\w\s,]+)/i);
        if (potentialKpis && potentialKpis[1]) {
          kpis = potentialKpis[1].split(',').map(k => k.trim());
        }
      }

      // Extract explanation
      let explanation = '';

      // Try to find an explanation section
      const explanationSection = data.response.match(/(?:explanation|reasoning|analysis):\s*([\s\S]+?)(?:\n\n|$)/i);
      if (explanationSection && explanationSection[1]) {
        explanation = explanationSection[1].trim();
      } else {
        // If no explanation section, use the first paragraph that's not the KPI list
        const paragraphs = data.response.split('\n\n');
        for (const paragraph of paragraphs) {
          if (!paragraph.match(/KPIs?:?[\s\n]*((?:-|\*|\d+\.)\s*[\w\s]+[\n\r]*)+/i) && paragraph.length > 20) {
            explanation = paragraph.trim();
            break;
          }
        }
      }

      // If we still don't have an explanation, use a generic one
      if (!explanation) {
        explanation = 'These KPIs were identified based on their correlation with other metrics in the survey data.';
      }

      return { kpis, explanation };
    } catch (error: any) {
      console.error('Error in local KPI detection:', error);
      throw new Error(`Local KPI detection failed: ${error.message}`);
    }
  }

  async analyzeSentiment(verbatimResponse: string, context?: string) {
    try {
      const { selectedModel } = useAIModeStore.getState();

      // Parse the response to get a better understanding of the data
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(verbatimResponse);
      } catch (e) {
        // If not valid JSON, use as is
        parsedResponse = verbatimResponse;
      }

      // Extract key information for sentiment analysis
      const responseStr = typeof parsedResponse === 'object' ?
        Object.entries(parsedResponse)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n') :
        String(verbatimResponse);

      const prompt = `
Perform sentiment analysis on this survey response:

${responseStr}
${context ? `\nAdditional context: ${context}` : ''}

Look for indicators of positive, negative, or neutral sentiment.
Consider:
- Numerical ratings (higher numbers typically indicate positive sentiment)
- Words expressing satisfaction or dissatisfaction
- Overall tone of the response

If there are numerical ratings (1-5 scale), use them to inform your analysis:
- Ratings 4-5 suggest positive sentiment
- Ratings 3 suggest neutral sentiment
- Ratings 1-2 suggest negative sentiment

RETURN ONLY THIS JSON FORMAT WITHOUT ANY OTHER TEXT OR FORMATTING:
{
  "sentimentScore": 0.7,  // Use a scale from -1.0 (very negative) to 1.0 (very positive)
  "sentimentLabel": "Positive",  // Use "Positive", "Negative", or "Neutral"
  "reason": "Brief explanation of the sentiment analysis"
}
`;

      const response = await fetch('/api/local-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: selectedModel.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get sentiment analysis response');
      }

      // Try to parse the response as JSON using our safe parser
      const jsonResponse = safeJsonParse(data.response);

      if (jsonResponse && (jsonResponse.sentimentScore !== undefined || jsonResponse.sentimentLabel)) {
        return {
          sentimentScore: typeof jsonResponse.sentimentScore === 'number' ? jsonResponse.sentimentScore : 0,
          sentimentLabel: jsonResponse.sentimentLabel || 'Neutral',
          reason: jsonResponse.reason || ''
        };
      }

      // If parsing fails or the response doesn't have the expected structure,
      // try to extract the information from the text
      console.warn('Failed to parse sentiment response as JSON, attempting to extract from text');

      // Default values
      let sentimentScore = 0;
      let sentimentLabel = 'Neutral';
      let reason = '';

      // Try to extract sentiment score - look for numbers with decimal points
      const scorePatterns = [
        /sentiment\s+score\s*:?\s*(-?\d+\.?\d*)/i,
        /score\s*:?\s*(-?\d+\.?\d*)/i,
        /(-?\d+\.?\d*)\s*\/\s*1/,  // Patterns like 0.7/1
        /score\s+of\s+(-?\d+\.?\d*)/i
      ];

      for (const pattern of scorePatterns) {
        const match = data.response.match(pattern);
        if (match && match[1]) {
          sentimentScore = parseFloat(match[1]);
          break;
        }
      }

      // Try to extract sentiment label
      const labelPatterns = [
        /sentiment\s+label\s*:?\s*["']?(Positive|Negative|Neutral)["']?/i,
        /sentiment\s+is\s+["']?(Positive|Negative|Neutral)["']?/i,
        /sentiment\s*:?\s*["']?(Positive|Negative|Neutral)["']?/i,
        /(Positive|Negative|Neutral)\s+sentiment/i
      ];

      for (const pattern of labelPatterns) {
        const match = data.response.match(pattern);
        if (match && match[1]) {
          sentimentLabel = match[1];
          break;
        }
      }

      // If we still don't have a label, infer from score
      if (sentimentLabel === 'Neutral') {
        if (sentimentScore > 0.3) {
          sentimentLabel = 'Positive';
        } else if (sentimentScore < -0.3) {
          sentimentLabel = 'Negative';
        }
      }

      // Try to extract reason
      const reasonPatterns = [
        /reason\s*:?\s*["']?([^"'\n]+)["']?/i,
        /reasoning\s*:?\s*["']?([^"'\n]+)["']?/i,
        /explanation\s*:?\s*["']?([^"'\n]+)["']?/i
      ];

      for (const pattern of reasonPatterns) {
        const match = data.response.match(pattern);
        if (match && match[1]) {
          reason = match[1].trim();
          break;
        }
      }

      // If we still don't have a reason, use the first paragraph that's not about the score or label
      if (!reason) {
        const paragraphs = data.response.split('\n\n');
        for (const paragraph of paragraphs) {
          if (!paragraph.match(/sentiment\s+score|sentiment\s+label|score\s*:|label\s*:/i) && paragraph.length > 20) {
            reason = paragraph.trim();
            break;
          }
        }
      }

      return { sentimentScore, sentimentLabel, reason };
    } catch (error: any) {
      console.error('Error in local sentiment analysis:', error);
      throw new Error(`Local sentiment analysis failed: ${error.message}`);
    }
  }

  async analyzeThemes(verbatimResponses: string[]) {
    try {
      const { selectedModel } = useAIModeStore.getState();

      // Parse the responses to get a better understanding of the data
      const parsedResponses = verbatimResponses.map(response => {
        try {
          return JSON.parse(response);
        } catch (e) {
          return response;
        }
      });

      // Format the responses for better analysis
      const formattedResponses = parsedResponses.map((response, i) => {
        if (typeof response === 'object') {
          // Format object responses as key-value pairs
          return `Response ${i+1}:\n${Object.entries(response)
            .map(([key, value]) => `  ${key}: ${value}`)
            .join('\n')}`;
        } else {
          // Use string responses as is
          return `Response ${i+1}: ${response}`;
        }
      }).join('\n\n');

      const prompt = `
Analyze these survey responses and identify common themes or patterns:

${formattedResponses}

Instructions:
1. Identify 2-4 distinct themes based on the responses
2. Group responses by these themes
3. Focus on feedback about user experience, features, or satisfaction
4. Give each theme a descriptive name that captures the key insight
5. Include the most relevant responses for each theme

For example, themes might include "User Interface Experience", "Feature Requests", "Performance Issues", etc.

RETURN ONLY THIS JSON FORMAT WITHOUT ANY OTHER TEXT OR FORMATTING:
{
  "themes": [
    {
      "theme": "Clear Theme Name",
      "responses": ["relevant response 1", "relevant response 2"]
    },
    {
      "theme": "Another Theme",
      "responses": ["relevant response 3", "relevant response 4"]
    }
  ]
}
`;

      const response = await fetch('/api/local-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: selectedModel.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get thematic analysis response');
      }

      // Try to parse the response as JSON using our safe parser
      const jsonResponse = safeJsonParse(data.response);

      if (jsonResponse && jsonResponse.themes && Array.isArray(jsonResponse.themes)) {
        return {
          themes: jsonResponse.themes
        };
      }

      // If parsing fails or the response doesn't have the expected structure,
      // try to extract themes from the text
      console.warn('Failed to parse thematic response as JSON, attempting to extract themes from text');

      // Try to identify themes in the text
      const themes: { theme: string; responses: string[] }[] = [];

      // Look for sections that might contain themes
      const themePatterns = [
        /Theme\s*\d*\s*:\s*([^\n]+)[\s\S]*?Responses?\s*:\s*([\s\S]*?)(?=Theme|$)/gi,
        /\d+\.\s*([^\n]+)[\s\S]*?Responses?\s*:\s*([\s\S]*?)(?=\d+\.|$)/gi,
        /\*\s*([^\n]+)[\s\S]*?Responses?\s*:\s*([\s\S]*?)(?=\*|$)/gi
      ];

      for (const pattern of themePatterns) {
        let match;
        while ((match = pattern.exec(data.response)) !== null) {
          if (match[1] && match[2]) {
            const theme = match[1].trim();
            const responsesText = match[2].trim();

            // Extract individual responses
            const responseItems = responsesText.split(/\n\s*[-*]\s*/).filter(Boolean);
            const responses = responseItems.length > 0 ?
              responseItems.map(r => r.trim()) :
              [responsesText]; // If we can't split, use the whole text

            themes.push({ theme, responses });
          }
        }
      }

      // If we couldn't find themes with the patterns, look for bullet points or numbered lists
      if (themes.length === 0) {
        const themeListMatch = data.response.match(/Themes?:\s*([\s\S]+)/i);
        if (themeListMatch && themeListMatch[1]) {
          const themeListText = themeListMatch[1];
          const themeItems = themeListText.match(/(?:-|\*|\d+\.)\s*([^\n]+)/g);

          if (themeItems) {
            // Create a theme for each item with a subset of responses
            const responsesPerTheme = Math.ceil(verbatimResponses.length / themeItems.length);

            themeItems.forEach((item, index) => {
              const theme = item.replace(/(?:-|\*|\d+\.)\s*/, '').trim();
              const startIdx = index * responsesPerTheme;
              const endIdx = Math.min(startIdx + responsesPerTheme, verbatimResponses.length);
              const responses = verbatimResponses.slice(startIdx, endIdx);

              themes.push({ theme, responses });
            });
          }
        }
      }

      // If we still couldn't find themes, create a simple structure
      if (themes.length === 0) {
        // Try to identify potential themes from the text
        const potentialThemes = data.response.match(/(?:themes|categories|topics)\s+(?:include|are|identified)\s+([\w\s,]+)/i);

        if (potentialThemes && potentialThemes[1]) {
          const themeNames = potentialThemes[1].split(',').map(t => t.trim());

          // Distribute responses among themes
          const responsesPerTheme = Math.ceil(verbatimResponses.length / themeNames.length);

          themeNames.forEach((theme, index) => {
            const startIdx = index * responsesPerTheme;
            const endIdx = Math.min(startIdx + responsesPerTheme, verbatimResponses.length);
            const responses = verbatimResponses.slice(startIdx, endIdx);

            themes.push({ theme, responses });
          });
        } else {
          // Create a single theme with all responses
          themes.push({
            theme: "General Feedback",
            responses: verbatimResponses
          });
        }
      }

      return { themes };
    } catch (error: any) {
      console.error('Error in local thematic analysis:', error);
      throw new Error(`Local thematic analysis failed: ${error.message}`);
    }
  }
}

export const localAIService = new LocalAIService();
