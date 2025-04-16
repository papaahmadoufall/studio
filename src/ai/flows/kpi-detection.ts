// src/ai/flows/kpi-detection.ts
'use server';
/**
 * @fileOverview Identifies key performance indicators (KPIs) from numerical survey responses.
 *
 * - detectKpis - A function that analyzes survey data to identify impactful KPIs using correlation analysis.
 * - DetectKpisInput - The input type for the detectKpis function.
 * - DetectKpisOutput - The return type for the detectKpis function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {SurveyData} from '@/services/data-upload';

const DetectKpisInputSchema = z.object({
  surveyData: z.array(z.record(z.any())).describe('Array of survey responses; each response is an object.'),
});
export type DetectKpisInput = z.infer<typeof DetectKpisInputSchema>;

const DetectKpisOutputSchema = z.object({
  kpis: z.array(z.string()).describe('List of identified key performance indicators.'),
  explanation: z.string().describe('Explanation of why these KPIs are important.'),
});
export type DetectKpisOutput = z.infer<typeof DetectKpisOutputSchema>;

export async function detectKpis(input: DetectKpisInput): Promise<DetectKpisOutput> {
  return detectKpisFlow(input);
}

const detectKpisPrompt = ai.definePrompt({
  name: 'detectKpisPrompt',
  input: {
    schema: z.object({
      surveyData: z.array(z.record(z.any())).describe('Array of survey responses; each response is an object.'),
    }),
  },
  output: {
    schema: z.object({
      kpis: z.array(z.string()).describe('List of identified key performance indicators.'),
      explanation: z.string().describe('Explanation of why these KPIs are important.'),
    }),
  },
  prompt: `You are an expert data analyst specializing in survey data.

  Analyze the provided survey data to identify the key performance indicators (KPIs).
  A KPI is a numerical data point which has the highest correlation to all the other numerical data points.
  Consider only the numerical survey responses when identifying KPIs.
  Return a list of the names of the columns which have a numerical datatype, and are KPIs.
  Also explain the reasoning behind why these data points are KPIs.

  Survey Data: {{{surveyData}}}
  `,
});

const detectKpisFlow = ai.defineFlow<
  typeof DetectKpisInputSchema,
  typeof DetectKpisOutputSchema
>(
  {
    name: 'detectKpisFlow',
    inputSchema: DetectKpisInputSchema,
    outputSchema: DetectKpisOutputSchema,
  },
  async input => {
    const {output} = await detectKpisPrompt(input);
    return output!;
  }
);
