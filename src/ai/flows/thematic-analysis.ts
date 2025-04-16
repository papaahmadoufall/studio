'use server';
/**
 * @fileOverview A thematic analysis AI agent that categorize open-ended survey responses into themes.
 *
 * - thematicAnalysis - A function that handles the thematic analysis process.
 * - ThematicAnalysisInput - The input type for the thematicAnalysis function.
 * - ThematicAnalysisOutput - The return type for the thematicAnalysis function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ThematicAnalysisInputSchema = z.object({
  verbatimResponses: z
    .array(z.string())
    .describe('An array of open-ended survey responses (verbatim).'),
});
export type ThematicAnalysisInput = z.infer<typeof ThematicAnalysisInputSchema>;

const ThematicAnalysisOutputSchema = z.object({
  themes: z
    .array(z.object({theme: z.string(), responses: z.array(z.string())}))
    .describe('An array of themes, each with a list of associated responses.'),
});
export type ThematicAnalysisOutput = z.infer<typeof ThematicAnalysisOutputSchema>;

export async function thematicAnalysis(input: ThematicAnalysisInput): Promise<ThematicAnalysisOutput> {
  return thematicAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'thematicAnalysisPrompt',
  input: {
    schema: z.object({
      verbatimResponses: z
        .array(z.string())
        .describe('An array of open-ended survey responses (verbatim).'),
    }),
  },
  output: {
    schema: z.object({
      themes: z
        .array(z.object({theme: z.string(), responses: z.array(z.string())}))
        .describe('An array of themes, each with a list of associated responses.'),
    }),
  },
  prompt: `You are an AI expert in natural language processing.

You will categorize open-ended survey responses into themes.

Consider the following verbatim responses:

{{#each verbatimResponses}}
- {{{this}}}
{{/each}}

Identify the main themes discussed in the feedback and return an array of themes, each with a list of associated responses.
`,
});

const thematicAnalysisFlow = ai.defineFlow<
  typeof ThematicAnalysisInputSchema,
  typeof ThematicAnalysisOutputSchema
>(
  {
    name: 'thematicAnalysisFlow',
    inputSchema: ThematicAnalysisInputSchema,
    outputSchema: ThematicAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
