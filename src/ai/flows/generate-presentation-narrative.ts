'use server';

import { z } from 'zod';
import { ai } from '@/ai/genkit';

const PresentationNarrativeInputSchema = z.object({
    brandName: z.string(),
    elevatorPitch: z.string(),
    targetAudience: z.string(),
    desirableCues: z.string().optional(),
    logoConceptSummary: z.string().optional(),
    palette: z.array(z.string()),
    colorNames: z.array(z.string()).optional(),
});

export type PresentationNarrativeInput = z.infer<typeof PresentationNarrativeInputSchema>;

const PresentationNarrativeOutputSchema = z.object({
    challengeTitle: z.string(),
    problemStatement: z.string(),
    marketContext: z.string(),
    solutionStatement: z.string(),
    keyAttributes: z.array(z.string()).length(3),
    targetAudienceStatement: z.string(),
    colorPhilosophy: z.string(),
    colorUsage: z.array(z.object({
        color: z.string(),
        name: z.string(),
        usage: z.string(),
    })),
    deliverablesList: z.array(z.string()),
    nextStepsStatement: z.string(),
    closingMessage: z.string(),
});

export type PresentationNarrativeOutput = z.infer<typeof PresentationNarrativeOutputSchema>;

export async function generatePresentationNarrative(input: PresentationNarrativeInput): Promise<PresentationNarrativeOutput> {
    const { brandName, elevatorPitch, targetAudience, desirableCues, logoConceptSummary, palette, colorNames } = input;

    const prompt = `
    You are an expert brand strategy consultant. Your goal is to generate a professional, story-driven narrative for a brand presentation for "${brandName}".
    
    The target user of this presentation is a designer (Sarah) presenting to their client. The tone should be professional, insightful, and persuasive, but accessible (no designer jargon).
    
    Brand Context:
    - Elevator Pitch: ${elevatorPitch}
    - Target Audience: ${targetAudience}
    ${desirableCues ? `- Desired Vibe: ${desirableCues}` : ''}
    ${logoConceptSummary ? `- Logo Concept: ${logoConceptSummary}` : ''}
    - Color Palette: ${palette.join(', ')}
    ${colorNames ? `- Color Names (suggested): ${colorNames.join(', ')}` : ''}

    Generate the following components:

    1. The Challenge:
       - challengeTitle: Default to "The Challenge" or a more creative variation.
       - problemStatement: A 2-3 sentence description of the market problem this brand solves.
       - marketContext: A brief statement on the gap this brand fills.

    2. The Solution:
       - solutionStatement: A punchy explanation of the brand's unique approach.
       - keyAttributes: 3 distinct brand keywords.
       - targetAudienceStatement: A clear description of who this is for.

    3. Color Story:
       - colorPhilosophy: A one-sentence explanation of the color palette's emotional intent.
       - colorUsage: For each color in the palette, provide a meaningful name and a specific usage hint (e.g., "Primary actions", "Backgrounds").

    4. Next Steps:
       - deliverablesList: A list of 4 key assets the client will receive (e.g., "Vector logo files", "Style guide").
       - nextStepsStatement: A clear call-to-action to bring the brand to life.
       - closingMessage: A final, inspiring brand message.

    Return the result in JSON format.
    `;

    try {
        const result = await ai.generate({
            model: 'anthropic/claude-sonnet-4-5-20250929',
            prompt,
            output: { schema: PresentationNarrativeOutputSchema },
        });

        if (!result.output) {
            throw new Error('Failed to generate presentation narrative');
        }

        return result.output;
    } catch (error) {
        console.error('Error generating presentation narrative:', error);
        throw new Error('Failed to generate presentation narrative');
    }
}
