
'use server';
/**
 * @fileOverview Generates a logo for a brand using AI.
 *
 * ⚠️ WARNING: This flow uses Google Imagen (gemini-3-pro-image-preview) which requires GOOGLE_GENAI_API_KEY.
 * If you don't have Google AI credits, use generateLogoFal() or generateLogoOpenAI() instead.
 *
 * - generateLogo - A function that generates a brand logo.
 * - GenerateLogoInput - The input type for the generateLogo function.
 * - GenerateLogoOutput - The return type for the generateLogo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {getGenerateLogoPrompt} from '@/ai/prompts/generate-logo';

const GenerateLogoInputSchema = z.object({
  name: z.string().describe('The name of the brand.'),
  elevatorPitch: z.string().describe('The elevator pitch for the brand.'),
  audience: z.string().describe('The target audience for the brand.'),
  desirableCues: z
    .string()
    .optional()
    .describe('Desirable visual cues for the logo.'),
  undesirableCues: z
    .string()
    .optional()
    .describe('Undesirable visual cues for the logo.'),
  promptName: z.string().optional().describe('Optional prompt name to select a prompt variant'),
});
export type GenerateLogoInput = z.infer<typeof GenerateLogoInputSchema>;

const GenerateLogoOutputSchema = z.object({
  logoUrl: z.string().describe('The data URI of the generated logo.'),
});
export type GenerateLogoOutput = z.infer<typeof GenerateLogoOutputSchema>;

export async function generateLogo(
  input: GenerateLogoInput
): Promise<GenerateLogoOutput> {
  return generateLogoFlow(input);
}

const generateLogoFlow = ai.defineFlow(
  {
    name: 'generateLogoFlow',
    inputSchema: GenerateLogoInputSchema,
    outputSchema: GenerateLogoOutputSchema,
  },
  async input => {
    const {key, prompt} = getGenerateLogoPrompt(input.promptName, input);
    console.log(`[generate-logo] Prompt key: ${key}`);

    const tryGenerate = async () => ai.generate({
      model: 'googleai/gemini-3-pro-image-preview',
      prompt,
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    let {media} = await tryGenerate();
    if (!media?.url) {
      console.warn('[generate-logo] First attempt returned no media URL. Retrying once...');
      ({media} = await tryGenerate());
    }

    if (!media?.url) {
      throw new Error('Image generation failed to return a data URI.');
    }

    return {logoUrl: media.url};
  }
);
