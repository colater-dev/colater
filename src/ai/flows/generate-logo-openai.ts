"use server";

import { z } from 'zod';
import { fal } from "@fal-ai/client";
import { ai } from '@/ai/genkit';
import { Buffer } from 'buffer';

const OpenAIGenerateLogoInputSchema = z.object({
  name: z.string(),
  elevatorPitch: z.string(),
  audience: z.string(),
  desirableCues: z.string().optional(),
  undesirableCues: z.string().optional(),
  promptName: z.string().optional(),
  size: z.enum(['512x512', '768x768', '1024x1024']).optional(),
  quality: z.enum(['standard', 'hd']).optional(),
  concept: z.string().optional(), // Optional logo concept from generate-logo-concept
});
export type OpenAIGenerateLogoInput = z.infer<typeof OpenAIGenerateLogoInputSchema>;

const OpenAIGenerateLogoOutputSchema = z.object({
  logoUrl: z.string(), // data URI
  prompt: z.string(), // The full prompt used for generation
});
export type OpenAIGenerateLogoOutput = z.infer<typeof OpenAIGenerateLogoOutputSchema>;

export async function generateLogoOpenAI(
  input: OpenAIGenerateLogoInput
): Promise<OpenAIGenerateLogoOutput> {
  const parsed = OpenAIGenerateLogoInputSchema.parse(input);

  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY environment variable is not set');
  }

  fal.config({
    credentials: process.env.FAL_KEY.trim(),
  });

  // Base style requirements for all icon logos
  const baseStylePrompt = "Flat black & white logo mark, minimal, negative-space, suitable at small sizes, no gradients, no texture, vector-style. Sharp edges blended with smooth curves, flat vector style, no gradients. Symmetric, abstract, tech-forward, with a clean silhouette readable at tiny sizes. Monochrome only.";

  // Sanitize inputs
  const cleanName = parsed.name.replace(/[\r\n]+/g, " ").trim();
  const cleanPitch = parsed.elevatorPitch.replace(/[\r\n]+/g, " ").trim();
  const cleanAudience = parsed.audience.replace(/[\r\n]+/g, " ").trim();
  const cleanDesirableCues = parsed.desirableCues?.replace(/[\r\n]+/g, " ").trim() || "";
  const cleanUndesirableCues = parsed.undesirableCues?.replace(/[\r\n]+/g, " ").trim() || "";

  let aiStylePrompt = "";

  // If concept is provided, extract the style prompt from it
  if (parsed.concept) {
    // Extract style prompt from concept (format: "concept text\n\nStyle Prompt: style prompt text")
    const stylePromptMatch = parsed.concept.match(/Style Prompt:\s*([\s\S]+)/);
    if (stylePromptMatch) {
      aiStylePrompt = stylePromptMatch[1].trim();
    } else {
      // If no "Style Prompt:" marker, use the entire concept
      aiStylePrompt = parsed.concept.trim();
    }
  } else {
    // Generate brand-specific style prompt using genkit (fallback)
    const stylePromptPrompt = `You are an expert brand designer. Based on the following brand information, describe the logo concept and create a detailed stylePrompt that can be used for ideogram image generation.

Brand Name: ${cleanName}
Elevator Pitch: ${cleanPitch}
Target Audience: ${cleanAudience}
${cleanDesirableCues ? `Desirable Visual Cues: ${cleanDesirableCues}` : ''}
${cleanUndesirableCues ? `Undesirable Visual Cues: ${cleanUndesirableCues}` : ''}

Describe the logo concept as a brand designer would, focusing on:
- Visual style and aesthetic
- Symbolic elements that represent the brand
- Design principles that align with the brand identity
- Specific visual characteristics

Then, return ONLY a concise stylePrompt (3-4 sentences) that can be directly used for ideogram image generation. The stylePrompt should be specific, actionable, and focused on visual design elements. Do not include the brand name or pitch in the stylePrompt - focus purely on the visual style and design characteristics.`;

    try {
      const genkitResponse = await ai.generate({
        model: 'anthropic/claude-sonnet-4-5-20250929',
        prompt: stylePromptPrompt,
      });
      aiStylePrompt = genkitResponse.text || "";
    } catch (error: any) {
      console.error('[generate-logo-openai] Error generating style prompt:', error);
      // Fallback to empty string if genkit call fails
      aiStylePrompt = "";
    }
  }

  // Use AI-generated style prompt if available, otherwise fallback to base style requirements
  const combinedStylePrompt = aiStylePrompt || baseStylePrompt;

  let fullPrompt = `${cleanPitch}. ${combinedStylePrompt}`;

  // Truncate prompt if too long (Ideogram usually handles long prompts, but safe limit is good)
  const originalPromptLength = fullPrompt.length;
  if (fullPrompt.length > 2000) {
    fullPrompt = fullPrompt.substring(0, 2000);
    console.warn(`[generate-logo-openai] Prompt truncated from ${originalPromptLength} to ${fullPrompt.length} characters`);
  }

  // Map size to fal image dimensions
  const sizeMap: Record<string, { width: number; height: number }> = {
    '512x512': { width: 512, height: 512 },
    '768x768': { width: 768, height: 768 },
    '1024x1024': { width: 1024, height: 1024 },
  };
  const imageSize = parsed.size && sizeMap[parsed.size]
    ? sizeMap[parsed.size]
    : { width: 1024, height: 1024 };

  try {
    // Use Ideogram V3 as requested
    const result: any = await fal.subscribe("fal-ai/ideogram/v3", {
      input: {
        prompt: fullPrompt,
        image_size: {
          width: imageSize.width,
          height: imageSize.height
        },
      },
      logs: true,
      onQueueUpdate: () => {},
    });

    // Fal returns image URLs, we need to convert to data URI
    const imageUrl = result.data?.images?.[0]?.url;
    if (!imageUrl) {
      throw new Error('Fal did not return an image URL.');
    }

    // Fetch the image and convert to data URI
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch generated image: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUri = `data:${contentType};base64,${base64}`;

    return { logoUrl: dataUri, prompt: fullPrompt };
  } catch (error: any) {
    console.error('[generate-logo-openai] Error:', error);
    const errorDetails = error.body ? JSON.stringify(error.body) : error.message;
    throw new Error(`Fal image generation failed: ${errorDetails}`);
  }
}
