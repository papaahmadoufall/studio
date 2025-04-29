'use server';
/**
 * @fileOverview A comprehensive survey analysis AI agent that handles KPIs, themes, sentiment, and NPS in one call.
 *
 * - comprehensiveAnalysis - A function that handles the complete survey analysis process.
 * - ComprehensiveAnalysisInput - The input type for the comprehensiveAnalysis function.
 * - ComprehensiveAnalysisOutput - The return type for the comprehensiveAnalysis function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

const ComprehensiveAnalysisInputSchema = z.object({
  surveyData: z.array(z.record(z.any())).describe('Array of survey responses; each response is an object.'),
  verbatimResponses: z.array(z.string()).optional().describe('An array of open-ended survey responses (verbatim).'),
  language: z.string().optional().describe('Language of the survey data. Defaults to English (en).'),
});
export type ComprehensiveAnalysisInput = z.infer<typeof ComprehensiveAnalysisInputSchema>;

// Define KPI type with importance and correlation scores
const KpiSchema = z.object({
  name: z.string().describe('Name of the KPI metric'),
  importance: z.number().min(0).max(1).describe('Importance score from 0 to 1'),
  correlation: z.number().min(-1).max(1).describe('Correlation coefficient from -1 to 1'),
});

// Define Theme type with sentiment score
const ThemeSchema = z.object({
  theme: z.string().describe('Name of the theme'),
  responses: z.array(z.string()).describe('List of responses associated with this theme'),
  sentiment: z.number().min(-1).max(1).describe('Sentiment score for this theme from -1 to 1'),
});

// Define sentiment distribution type
const SentimentDistributionSchema = z.object({
  positive: z.number().min(0).max(100).describe('Percentage of positive sentiment'),
  neutral: z.number().min(0).max(100).describe('Percentage of neutral sentiment'),
  negative: z.number().min(0).max(100).describe('Percentage of negative sentiment'),
});

// Define categorized comments type
const CategorizedCommentsSchema = z.object({
  positive: z.array(z.string()).describe('List of positive comments'),
  neutral: z.array(z.string()).describe('List of neutral comments'),
  negative: z.array(z.string()).describe('List of negative comments'),
});

// Define overall sentiment type
const OverallSentimentSchema = z.object({
  score: z.number().min(-1).max(1).describe('Overall sentiment score from -1 to 1'),
  distribution: SentimentDistributionSchema,
  commentCount: z.number().describe('Total number of comments analyzed'),
  categorizedComments: CategorizedCommentsSchema.describe('Comments categorized by sentiment'),
});

// Define NPS type
const NpsSchema = z.object({
  score: z.number().describe('Net Promoter Score'),
  promoters: z.number().describe('Percentage of promoters'),
  passives: z.number().describe('Percentage of passives'),
  detractors: z.number().describe('Percentage of detractors'),
});

const ComprehensiveAnalysisOutputSchema = z.object({
  kpis: z.array(KpiSchema).describe('List of identified key performance indicators with importance and correlation scores'),
  themes: z.array(ThemeSchema).describe('List of identified themes with associated responses and sentiment scores'),
  overallSentiment: OverallSentimentSchema.describe('Overall sentiment analysis results'),
  nps: NpsSchema.optional().describe('Net Promoter Score analysis if applicable'),
});
export type ComprehensiveAnalysisOutput = z.infer<typeof ComprehensiveAnalysisOutputSchema>;

export async function comprehensiveAnalysis(input: ComprehensiveAnalysisInput): Promise<ComprehensiveAnalysisOutput> {
  return comprehensiveAnalysisFlow(input);
}

// Helper function to preprocess responses
function preprocessResponses(responses: string[]): string[] {
  return responses.map(response => {
    // Trim whitespace
    let processed = response.trim();

    // Remove any extremely long responses (likely JSON objects or other non-text data)
    if (processed.length > 1000) {
      processed = processed.substring(0, 997) + '...';
    }

    return processed;
  });
}

const comprehensiveAnalysisPrompt = ai.definePrompt({
  name: 'comprehensiveAnalysisPrompt',
  input: {
    schema: ComprehensiveAnalysisInputSchema,
  },
  output: {
    schema: ComprehensiveAnalysisOutputSchema,
  },
  prompt: `You are an expert data analyst specializing in survey analysis. Perform a comprehensive analysis of the provided survey data covering three aspects: KPIs, Themes, and Sentiment.

SURVEY DATA:
{{#if surveyData}}
Numerical Data: {{{surveyData}}}
{{/if}}

VERBATIM RESPONSES:
{{#if verbatimResponses}}
{{#each verbatimResponses}}
- {{{this}}}
{{/each}}
{{/if}}

{{#if language}}
LANGUAGE CONTEXT: The data is in {{language}} language. Consider language-specific patterns, expressions, and cultural context in your analysis.
{{/if}}

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
    "commentCount": number,
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
}`,
});

const comprehensiveAnalysisFlow = ai.defineFlow<
  typeof ComprehensiveAnalysisInputSchema,
  typeof ComprehensiveAnalysisOutputSchema
>(
  {
    name: 'comprehensiveAnalysisFlow',
    inputSchema: ComprehensiveAnalysisInputSchema,
    outputSchema: ComprehensiveAnalysisOutputSchema,
  },
  async input => {
    const maxRetries = 3;
    let retries = 0;
    let delay = 2000; // Initial delay of 2 seconds

    // Prepare verbatim responses if they exist
    let processedInput = { ...input };
    if (input.verbatimResponses) {
      processedInput.verbatimResponses = preprocessResponses(input.verbatimResponses);
    }

    while (retries < maxRetries) {
      try {
        const { output } = await comprehensiveAnalysisPrompt(processedInput);
        return output!;
      } catch (error: any) {
        if (error.message.includes('429 Too Many Requests')) {
          console.warn(`Rate limit exceeded. Retrying in ${delay / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
          retries++;
        } else {
          // If it's not a rate limit error, re-throw the error
          throw error;
        }
      }
    }

    throw new Error('Failed to complete comprehensive analysis after multiple retries due to rate limiting.');
  }
);
