'use server';

import { z } from 'zod';
import { ai } from '@/ai/genkit';

export type GenerateAudienceSuggestionsInput = {
    brandName: string;
    elevatorPitch: string;
};

const GenerateAudienceSuggestionsOutputSchema = z.object({
    suggestions: z.array(z.string()).length(4).describe('Exactly 4 concise target audience suggestions (2-4 words each)'),
});

export type GenerateAudienceSuggestionsOutput = z.infer<typeof GenerateAudienceSuggestionsOutputSchema>;

export async function generateAudienceSuggestions(
    input: GenerateAudienceSuggestionsInput
): Promise<GenerateAudienceSuggestionsOutput> {
    const { brandName, elevatorPitch } = input;

    const prompt = `
    You are a brand strategist helping define target audiences.

    Brand Name: ${brandName}
    Elevator Pitch: ${elevatorPitch}

    Generate exactly 4 concise, highly relevant target audience suggestions for this brand.
    Each suggestion should be:
    - Short (2-4 words)
    - Specific to this brand's value proposition
    - Actionable and clear
    - Different from each other (cover different angles)

    Examples of good suggestions:
    - "Enterprise IT Teams"
    - "Remote-First Startups"
    - "B2B SaaS Leaders"
    - "DevOps Engineers"

    Return the 4 suggestions in JSON format.
    `;

    try {
        const result = await ai.generate({
            model: 'anthropic/claude-sonnet-4-5-20250929',
            prompt,
            output: { schema: GenerateAudienceSuggestionsOutputSchema },
        });

        if (!result.output) {
            throw new Error('Failed to generate audience suggestions');
        }

        return result.output;
    } catch (error) {
        console.error('Error generating audience suggestions:', error);
        // Fallback to generic suggestions
        return {
            suggestions: ['Tech Professionals', 'Young Parents', 'Fitness Enthusiasts', 'Eco-conscious Foodies']
        };
    }
}
