'use server';
/**
 * @fileOverview Generates a logo concept/prompt for a brand using AI.
 *
 * - generateLogoConcept - A function that generates a logo concept as a brand designer would.
 * - GenerateLogoConceptInput - The input type for the generateLogoConcept function.
 * - GenerateLogoConceptOutput - The return type for the generateLogoConcept function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateLogoConceptInputSchema = z.object({
  name: z.string().describe('The name of the brand.'),
  elevatorPitch: z.string().describe('The elevator pitch for the brand.'),
  audience: z.string().describe('The target audience for the brand.'),
  desirableCues: z.string().optional().describe('Desirable visual cues for the brand identity.'),
  undesirableCues: z.string().optional().describe('Undesirable visual cues for the brand identity.'),
});
export type GenerateLogoConceptInput = z.infer<
  typeof GenerateLogoConceptInputSchema
>;

const GenerateLogoConceptOutputSchema = z.object({
  concept: z.string().describe('A detailed logo concept and prompt that can be used for visual model generation.'),
  stylePrompt: z.string().describe('A concise style prompt focused on visual design elements.'),
});
export type GenerateLogoConceptOutput = z.infer<
  typeof GenerateLogoConceptOutputSchema
>;

export async function generateLogoConcept(
  input: GenerateLogoConceptInput
): Promise<GenerateLogoConceptOutput> {
  return generateLogoConceptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLogoConceptPrompt',
  input: { schema: GenerateLogoConceptInputSchema },
  output: { schema: GenerateLogoConceptOutputSchema },
  prompt: `You are a veteran brand designer known for creating sharp, iconic, black-and-white marks. Study the brand details and produce a decisive creative direction that guides a visual model toward a clean, structured logo.

Brand Name: {{{name}}}
Elevator Pitch: {{{elevatorPitch}}}
Target Audience: {{{audience}}}
Desirable Visual Cues: {{{desirableCues}}}
Undesirable Visual Cues: {{{undesirableCues}}}

⸻

1. Logo Concept (2-3 sentences)

Describe a focused, highly visual concept by specifying:
- Start with "Design a solid black icon on a plain white background"...
- A primary metaphor (plus optional secondary) that translates directly into shapes.
- The exact visual logic of the mark (e.g., two interlocking arcs, three modular bars forming a rotational hub, a continuous folded loop).
- The structure of the silhouette (symmetry, roundedness, center-weight, negative-space treatment, line weight, and edge behavior).
Do not mention the brand name or text.

⸻

2. Style Prompt (2-3 sentences)

Provide a concise, technical, visual-only prompt that the model can execute directly. Include:
	•	Shape language (geometric, monoline, angular, rounded, minimalist).
	•	Linework and edge qualities (uniform stroke, sharp intersections, smooth curvature transitions, solid fills when needed).
	•	Spatial composition (balanced, symmetric, tight silhouette, negative-space clarity).
End with: “Monochrome black icon on a white background.”`,
});

const generateLogoConceptFlow = ai.defineFlow(
  {
    name: 'generateLogoConceptFlow',
    inputSchema: GenerateLogoConceptInputSchema,
    outputSchema: GenerateLogoConceptOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);

