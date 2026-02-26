'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GeneratePresentationDataInputSchema = z.object({
    name: z.string(),
    elevatorPitch: z.string(),
    concept: z.string(),
    prompt: z.string().optional(),
    critiqueSummary: z.string().optional(),
    critiquePoints: z.array(z.string()).optional(),
});

export type GeneratePresentationDataInput = z.infer<typeof GeneratePresentationDataInputSchema>;

const GeneratePresentationDataOutputSchema = z.object({
    tagline: z.string().describe('A short, catchy tagline derived from the concept.'),
    brandStatement: z.string().describe('A bold, compressed brand statement (max 10 words).'),
    supportingLine: z.string().describe('A supporting line for the brand statement.'),
    visualIntentPhrases: z.array(z.string()).describe('3-4 keywords or short phrases (e.g., "modular", "high-contrast").'),
    colorPhilosophy: z.string().describe('A short line describing the color philosophy.'),
    closingStatement: z.string().describe('A single closing statement that defines the brand\'s role.'),
});

export type GeneratePresentationDataOutput = z.infer<typeof GeneratePresentationDataOutputSchema>;

export const generatePresentationData = ai.defineFlow(
    {
        name: 'generatePresentationData',
        inputSchema: GeneratePresentationDataInputSchema,
        outputSchema: GeneratePresentationDataOutputSchema,
    },
    async (input) => {
        const prompt = `
      You are an expert brand strategist. Based on the following brand details, generate concise, high-authority content for a premium brand presentation deck.

      Brand Name: ${input.name}
      Elevator Pitch: ${input.elevatorPitch}
      Logo Concept: ${input.concept}
      ${input.prompt ? `Generation Prompt: ${input.prompt}` : ''}
      ${input.critiqueSummary ? `Visual Critique Summary: ${input.critiqueSummary}` : ''}
      ${input.critiquePoints ? `Key Critique Points: ${input.critiquePoints.join(', ')}` : ''}

      Generate the following:
      1. A short, punchy tagline.
      2. A bold brand statement (max 10 words) that captures the essence.
      3. A supporting line for that statement.
      4. 3-4 visual intent phrases that explain the design (e.g., "confident", "contemporary", "modular").
      5. A one-sentence color philosophy.
      6. A powerful single closing statement defining the brand's role in one sentence.

      Keep the tone sophisticated, minimal, and authoritative.
    `;

        const response = await ai.generate({
            model: 'anthropic/claude-sonnet-4-5-20250929',
            prompt,
            output: { format: 'json', schema: GeneratePresentationDataOutputSchema },
        });

        if (!response.output) {
            throw new Error('Failed to generate presentation data');
        }

        return response.output;
    }
);
