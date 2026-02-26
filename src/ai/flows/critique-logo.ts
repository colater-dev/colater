'use server';

import { z } from 'zod';
import { ai } from '@/ai/genkit';

export type CritiqueLogoInput = {
    logoUrl: string;
    brandName: string;
    elevatorPitch: string;
    audience: string;
    desirableCues?: string;
    undesirableCues?: string;
};

const CritiqueSchema = z.object({
    overallSummary: z.string().describe('A brief summary of the overall impression of the logo'),
    points: z.array(z.object({
        x: z.number().min(0).max(100).describe('X coordinate percentage (0-100) of the specific point to annotate'),
        y: z.number().min(0).max(100).describe('Y coordinate percentage (0-100) of the specific point to annotate'),
        comment: z.string().describe('A concise critique comment for this specific point (max 10 words)'),
        sentiment: z.enum(['positive', 'negative']).describe('Whether this point is a pro (positive) or a con (negative)'),
    })).length(2).describe('Exactly 2 points: 1 positive and 1 negative'),
});

export type Critique = z.infer<typeof CritiqueSchema>;

export async function critiqueLogo(input: CritiqueLogoInput): Promise<Critique & { points: { id: string }[] }> {
    const { logoUrl, brandName, elevatorPitch, audience, desirableCues, undesirableCues } = input;

    const prompt = `
    You are an expert brand identity designer and critic.
    Analyze the provided logo for the brand "${brandName}".

    Brand Context:
    - Elevator Pitch: ${elevatorPitch}
    - Target Audience: ${audience}
    ${desirableCues ? `- Desirable Cues: ${desirableCues}` : ''}
    ${undesirableCues ? `- Undesirable Cues: ${undesirableCues}` : ''}

    Your task:
    1. Provide a brief overall summary of the logo.
    2. Identify exactly 2 specific points on the image to critique:
       - 1 POSITIVE aspect (what works well)
       - 1 NEGATIVE aspect (what could be improved)
    3. For each point:
       - Keep the comment CONCISE (maximum 10 words)
       - Provide the X and Y coordinates (0-100 percentage) for the center of the feature being discussed.

    Return the result in JSON format.
  `;

    try {
        const result = await ai.generate({
            model: 'anthropic/claude-sonnet-4-5-20250929', // Claude Sonnet has vision capabilities
            prompt: [
                { text: prompt },
                { media: { url: logoUrl } }
            ],
            output: { schema: CritiqueSchema },
        });

        if (!result.output) {
            throw new Error('Failed to generate critique');
        }

        // Add IDs to points
        const critiqueWithIds = {
            ...result.output,
            points: result.output.points.map(point => ({
                ...point,
                id: Math.random().toString(36).substring(2, 9),
            })),
        };

        return critiqueWithIds;
    } catch (error) {
        console.error('Error critiquing logo:', error);
        throw new Error('Failed to critique logo');
    }
}
