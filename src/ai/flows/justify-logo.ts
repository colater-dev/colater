'use server';

import { z } from 'zod';
import { ai } from '@/ai/genkit';

export type JustifyLogoInput = {
    logoUrl: string;
    brandName: string;
    elevatorPitch: string;
    audience: string;
    desirableCues?: string;
    undesirableCues?: string;
};

export interface JustificationPoint {
    x: number;
    y: number;
    comment: string;
    id: string;
}

export interface Justification {
    overallSummary: string;
    points: JustificationPoint[];
}

const JustificationSchema = z.object({
    overallSummary: z.string().describe('A brief summary of why the logo is a great fit for the brand'),
    points: z.array(z.object({
        x: z.number().min(0).max(100).describe('X coordinate percentage (0-100) of the specific feature to highlight'),
        y: z.number().min(0).max(100).describe('Y coordinate percentage (0-100) of the specific feature to highlight'),
        comment: z.string().describe('A concise justification for this specific point (max 12 words)'),
    })).length(2).describe('Exactly 2 distinct positive justifications'),
});

export async function justifyLogo(input: JustifyLogoInput): Promise<Justification> {
    const { logoUrl, brandName, elevatorPitch, audience, desirableCues, undesirableCues } = input;

    const prompt = `
    You are an expert brand strategy consultant and identity designer.
    Provide a professional justification for why the provided logo is a perfect match for the brand "${brandName}".

    Brand Context:
    - Elevator Pitch: ${elevatorPitch}
    - Target Audience: ${audience}
    ${desirableCues ? `- Strategic Goals: ${desirableCues}` : ''}
    ${undesirableCues ? `- Avoidance Criteria: ${undesirableCues}` : ''}

    Your task:
    1. Provide a brief overall summary of why this logo successfully represents the brand identity and values.
    2. Identify exactly 2 distinct features of the logo that demonstrate a perfect strategic fit:
       - Focus on symbols, composition, color usage, or metaphors.
       - Each justification must be purely POSITIVE and strategic.
    3. For each point:
       - Keep the comment CONCISE (maximum 12 words).
       - Provide the X and Y coordinates (0-100 percentage) for the feature being highlighted.

    Return the result in JSON format.
  `;

    try {
        const result = await ai.generate({
            model: 'anthropic/claude-sonnet-4-5-20250929', // Claude Sonnet has vision capabilities
            prompt: [
                { text: prompt },
                { media: { url: logoUrl } }
            ],
            output: { schema: JustificationSchema },
        });

        if (!result.output) {
            throw new Error('Failed to generate justification');
        }

        // Add IDs to points
        const justificationWithIds = {
            ...result.output,
            points: result.output.points.map(point => ({
                ...point,
                id: Math.random().toString(36).substring(2, 9),
            })),
        };

        return justificationWithIds;
    } catch (error) {
        console.error('Error justifying logo:', error);
        throw new Error('Failed to justify logo');
    }
}
