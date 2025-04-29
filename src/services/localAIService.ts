// Local AI service that uses the local-ai API route to process requests
import { useAIModeStore } from '@/stores/aiModeStore';
import { safeJsonParse } from '@/utils/json-parser';

export class LocalAIService {
  // Helper method to call the local AI API
  private async callLocalAI(prompt: string, model: string) {
    try {
      const response = await fetch('/api/local-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from local AI');
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling local AI:', error);
      throw error;
    }
  }

  // Comprehensive analysis method that handles all aspects of survey analysis
  async comprehensiveAnalysis(surveyData: any[], verbatimResponses: string[], language: string = 'en') {
    try {
      const { selectedModel } = useAIModeStore.getState();

      // Get language-specific instructions
      const languageInstructions = this.getLanguageInstructions(language, 'theme');

      // Log the data size for debugging
      console.log(`Comprehensive analysis: Processing ${surveyData.length} survey rows and ${verbatimResponses.length} comments`);

      // Limit the survey data to avoid overwhelming the model
      const surveyDataSample = surveyData.length > 20 ? surveyData.slice(0, 20) : surveyData;

      // Process all verbatim responses but summarize them for the prompt
      const totalResponses = verbatimResponses.length;
      console.log(`Total verbatim responses to analyze: ${totalResponses}`);

      // Take a representative sample of verbatim responses for the AI prompt
      // but we'll use the full dataset for analysis later
      const verbatimSample = verbatimResponses.length > 100
        ? verbatimResponses.slice(0, 100)
        : verbatimResponses;

      const prompt = `You are an expert data analyst specializing in survey analysis. Perform a comprehensive analysis of the provided survey data covering three aspects: KPIs, Themes, and Sentiment.

SURVEY DATA (${surveyData.length} total rows, showing first ${surveyDataSample.length} as sample):
${JSON.stringify(surveyDataSample, null, 2)}

VERBATIM RESPONSES (${totalResponses} total comments, showing ${verbatimSample.length} as sample):
${verbatimSample.map(response => `- ${response}`).join('\n')}

${languageInstructions}

ANALYSIS INSTRUCTIONS:

1. KPI ANALYSIS:
- Identify 3-5 most impactful numerical metrics from the survey data
- Focus on metrics that correlate with overall satisfaction or performance
- Exclude demographic data unless directly relevant to performance
- Calculate importance scores (0-1) and correlation coefficients

2. THEMATIC ANALYSIS:
- Identify 3-5 main themes from verbatim responses
- Group similar responses under each theme
- Ensure themes are distinct and meaningful
- Consider both explicit and implicit patterns

3. SENTIMENT ANALYSIS:
- Score each theme's sentiment (-1 to 1)
- Calculate overall sentiment distribution
- Categorize each comment as positive, neutral, or negative
- Count the total number of comments analyzed
- Consider:
  * Explicit sentiment words
  * Context and tone
  * Cultural expressions of satisfaction/dissatisfaction
  * Numerical ratings if present

4. NPS CALCULATION (if applicable):
- Calculate Net Promoter Score if the data contains ratings
- Identify promoters (9-10), passives (7-8), and detractors (0-6)
- Calculate percentages and final NPS score

OUTPUT FORMAT:
{
  "kpis": [
    {
      "name": "metric_name",
      "importance": 0.0-1.0,
      "correlation": -1.0-1.0
    }
  ],
  "themes": [
    {
      "theme": "theme_name",
      "responses": ["response1", "response2"],
      "sentiment": -1.0-1.0
    }
  ],
  "overallSentiment": {
    "score": -1.0-1.0,
    "distribution": {
      "positive": 0-100,
      "neutral": 0-100,
      "negative": 0-100
    },
    "commentCount": ${totalResponses},
    "categorizedComments": {
      "positive": ["comment1", "comment2"],
      "neutral": ["comment3", "comment4"],
      "negative": ["comment5", "comment6"]
    }
  },
  "nps": {
    "score": number,
    "promoters": 0-100,
    "passives": 0-100,
    "detractors": 0-100
  }
}

RETURN ONLY THIS JSON FORMAT WITHOUT ANY OTHER TEXT OR FORMATTING.
`;

      const data = await this.callLocalAI(prompt, selectedModel.id);

      // Parse the response as JSON using our safe parser
      const jsonResponse = safeJsonParse(data.response);

      if (jsonResponse) {
        return jsonResponse;
      }

      // If safe parsing fails, try to extract JSON from the response using regex
      console.error("Error parsing comprehensive analysis response using safeJsonParse");

      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("Error parsing extracted JSON:", e);

          // Create a fallback response structure with accurate comment count
          return this.createFallbackResponse(verbatimResponses);
        }
      } else {
        console.error("AI response did not contain valid JSON");

        // Create a fallback response structure with accurate comment count
        return this.createFallbackResponse(verbatimResponses);
      }
    } catch (error) {
      console.error("Error in comprehensive analysis:", error);
      throw error;
    }
  }

  // Helper method to create a fallback response when AI fails
  private createFallbackResponse(verbatimResponses: string[]) {
    console.log(`Creating fallback analysis for ${verbatimResponses.length} comments`);

    // Count total comments - ensure we're using the full dataset
    const totalComments = verbatimResponses.length;
    console.log(`Total comments for fallback analysis: ${totalComments}`);

    // Simple sentiment analysis to distribute comments
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'like', 'love', 'best', 'awesome'];
    const negativeWords = ['bad', 'poor', 'terrible', 'unhappy', 'dissatisfied', 'dislike', 'hate', 'worst', 'awful'];

    const positive: string[] = [];
    const neutral: string[] = [];
    const negative: string[] = [];

    // Process all comments - no sampling here
    console.log(`Processing all ${verbatimResponses.length} comments for sentiment analysis`);

    // Categorize comments
    verbatimResponses.forEach((comment, index) => {
      if (index % 100 === 0) {
        console.log(`Processed ${index} of ${verbatimResponses.length} comments`);
      }

      const text = comment.toLowerCase();
      const posMatches = positiveWords.filter(word => text.includes(word)).length;
      const negMatches = negativeWords.filter(word => text.includes(word)).length;

      if (posMatches > negMatches) {
        positive.push(comment);
      } else if (negMatches > posMatches) {
        negative.push(comment);
      } else {
        neutral.push(comment);
      }
    });

    console.log(`Sentiment distribution: Positive=${positive.length}, Neutral=${neutral.length}, Negative=${negative.length}`);

    // Calculate distribution percentages
    const positivePercent = Math.round((positive.length / totalComments) * 100) || 0;
    const negativePercent = Math.round((negative.length / totalComments) * 100) || 0;
    const neutralPercent = 100 - positivePercent - negativePercent;

    return {
      kpis: [],
      themes: [
        {
          theme: "General Feedback",
          responses: verbatimResponses.slice(0, 10),
          sentiment: 0
        }
      ],
      overallSentiment: {
        score: (positivePercent - negativePercent) / 100,
        distribution: {
          positive: positivePercent,
          neutral: neutralPercent,
          negative: negativePercent
        },
        commentCount: totalComments,
        categorizedComments: {
          positive,
          neutral,
          negative
        }
      }
    };
  }

  // Helper method to get language-specific instructions
  private getLanguageInstructions(language: string, analysisType: 'kpi' | 'sentiment' | 'theme'): string {
    if (language === 'en') {
      return ''; // Default language, no special instructions needed
    }

    // Common instruction for all analysis types
    let instruction = `Note: The survey data is in ${language} language. `;

    // Specific instructions based on analysis type
    switch (analysisType) {
      case 'kpi':
        instruction += `Please consider language-specific nuances when identifying KPIs. Column names and values may be in ${language}.`;
        break;
      case 'sentiment':
        instruction += `Please analyze sentiment considering ${language} language patterns and expressions. Cultural context may affect how sentiment is expressed.`;
        break;
      case 'theme':
        instruction += `Please identify themes considering ${language} language patterns and cultural context. Group similar concepts that may be expressed differently than in English.`;
        break;
    }

    return instruction;
  }

  async detectKpis(surveyData: any[], language: string = 'en') {
    try {
      const { selectedModel } = useAIModeStore.getState();

      // Use more data for better analysis
      const surveyDataSample = surveyData.slice(0, 5);

      // Extract column names for better analysis
      const columnNames = surveyData.length > 0 ? Object.keys(surveyData[0]) : [];
      const numericColumns = columnNames.filter(col => {
        return surveyData.some(row => typeof row[col] === 'number' || !isNaN(Number(row[col])));
      });

      // Get language-specific instructions
      const languageInstructions = this.getLanguageInstructions(language, 'kpi');

      const prompt = `
Analyze this survey data and identify the key performance indicators (KPIs).

A KPI is a numerical metric that strongly influences overall satisfaction or performance.
Focus on numerical columns that show patterns or correlations with other metrics.

Survey columns: ${columnNames.join(', ')}
Numerical columns: ${numericColumns.join(', ')}

Survey Data Sample:
${JSON.stringify(surveyDataSample, null, 2)}

${languageInstructions}

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

  async analyzeSentiment(verbatimResponse: string, language: string = 'en', context?: string) {
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

      // Get language-specific instructions
      const languageInstructions = this.getLanguageInstructions(language, 'sentiment');

      const prompt = `
Perform sentiment analysis on this survey response:

${responseStr}
${context ? `\nAdditional context: ${context}` : ''}

${languageInstructions}

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

  async analyzeThemes(verbatimResponses: string[], language: string = 'en') {
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

      // Get language-specific instructions
      const languageInstructions = this.getLanguageInstructions(language, 'theme');

      const prompt = `
Analyze these survey responses and identify common themes or patterns:

${formattedResponses}

${languageInstructions}

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
      // try to extract the information from the text
      console.warn('Failed to parse thematic analysis response as JSON, attempting to extract from text');

      // Create a default themes array
      const themes: { theme: string, responses: string[] }[] = [];

      // Try to find themes in the text - try different patterns
      const themesSection = data.response.match(/themes\s*:?\s*\[([\s\S]*?)\]/i);
      if (themesSection && themesSection[1]) {
        // Try to parse the themes array
        try {
          const themesArray = JSON.parse(`[${themesSection[1]}]`);
          if (Array.isArray(themesArray)) {
            themesArray.forEach((themeObj: any) => {
              if (themeObj.theme && themeObj.responses) {
                themes.push({
                  theme: themeObj.theme,
                  responses: Array.isArray(themeObj.responses) ? themeObj.responses : [String(themeObj.responses)]
                });
              }
            });
          }
        } catch (e) {
          console.warn('Failed to parse themes array:', e);

          // Try to extract themes using regex
          const themeItems = themesSection[1].match(/theme\s*:?\s*["']([^"']+)["']/gi);
          const responsesItems = themesSection[1].match(/responses\s*:?\s*\[([\s\S]*?)\]/gi);

          if (themeItems && responsesItems && themeItems.length === responsesItems.length) {
            for (let i = 0; i < themeItems.length; i++) {
              const themeMatch = themeItems[i].match(/theme\s*:?\s*["']([^"']+)["']/i);
              const responsesMatch = responsesItems[i].match(/responses\s*:?\s*\[([\s\S]*?)\]/i);

              if (themeMatch && themeMatch[1] && responsesMatch && responsesMatch[1]) {
                const theme = themeMatch[1].trim();
                const responsesText = responsesMatch[1].trim();

                // Extract individual responses
                const responseItems = responsesText.split(/\n\s*[-*]\s*/).filter(Boolean);
                const responses = responseItems.length > 0 ?
                  responseItems.map(r => r.trim()) :
                  [responsesText]; // If we can't split, use the whole text

                themes.push({ theme, responses });
              }
            }
          }

          // If we still don't have themes, try to find theme names in a list
          if (themes.length === 0) {
            const themeListMatch = data.response.match(/themes?:?[\s\n]*((?:-|\*|\d+\.)\s*[\w\s]+[\n\r]*)+/i);
            const themeItems = themeListMatch && themeListMatch[1] ?
              themeListMatch[1].match(/(?:-|\*|\d+\.)\s*([\w\s]+)/g) : null;

            if (themeItems) {
              // Create a theme for each item with a subset of responses
              const responsesPerTheme = Math.ceil(verbatimResponses.length / themeItems.length);

              themeItems.forEach((item: string, index: number) => {
                const theme = item.replace(/(?:-|\*|\d+\.)\s*/, '').trim();
                const startIdx = index * responsesPerTheme;
                const endIdx = Math.min(startIdx + responsesPerTheme, verbatimResponses.length);
                const responses = verbatimResponses.slice(startIdx, endIdx);

                themes.push({ theme, responses });
              });
            }
          }
        }
      }

      // If we still don't have themes, try to find them in the text
      if (themes.length === 0) {
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
