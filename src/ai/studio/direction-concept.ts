import { z } from 'genkit';
import { tagLabel } from '@/lib/brand-tags';
import { withTimeout } from '@/lib/with-timeout';
import { IDEA_TYPE_GUIDANCE, type Recipe } from './recipes';

export interface DirectionBrief {
  name: string;
  pitch: string;
  audienceTags: string[];
  styleTags: string[];
  recipe: Recipe;
  feedbackChips?: string[];
  seedIdea?: string;
}

export const DirectionConceptSchema = z.object({
  idea: z.string().describe('The core idea of the mark in one short sentence (max 12 words).'),
  rationale: z.string().describe('Why it fits the brand, max 20 words.'),
  markPrompt: z.string().describe('Visual-only prompt for an image model: shapes, structure, line quality. No brand name, no text in the image.'),
  captions: z.object({
    mark: z.string().describe('Caption for the mark slide, 2-6 words.'),
    lockup: z.string().describe('Caption for the mark-with-name slide, 2-6 words.'),
    inUse: z.string().describe('Caption for the in-use slide, 2-6 words.'),
  }),
  stickerSurface: z.string().describe('1-3 plain words for a stock-photo search: a flat everyday surface in this brand\'s world where its sticker would be stuck, e.g. "concrete wall", "wooden table", "skateboard deck".'),
  typeSample: z.object({
    headline: z.string().describe('A short headline in the brand voice, max 6 words, to show off the typeface. Not the brand name.'),
    body: z.string().describe('One sentence of body copy in the brand voice, max 20 words.'),
  }),
});
export type DirectionConcept = z.infer<typeof DirectionConceptSchema>;

export function buildDirectionConceptPrompt(b: DirectionBrief): string {
  const lines = [
    'You are a veteran brand designer creating ONE logo direction.',
    `Brand: ${b.name}`,
    `What it does: ${b.pitch}`,
    `Audience: ${b.audienceTags.map(tagLabel).join(', ') || 'general'}`,
    `Style: ${b.styleTags.map(tagLabel).join(', ') || 'Minimal'}`,
    `Idea type for this direction: ${IDEA_TYPE_GUIDANCE[b.recipe.ideaType]}`,
    `Lean especially ${tagLabel(b.recipe.styleLean).toLowerCase()}.`,
  ];
  if (b.feedbackChips?.length) lines.push(`Feedback on previous directions: ${b.feedbackChips.join(', ')}`);
  if (b.seedIdea) lines.push(`Explore a variation of this earlier direction: ${b.seedIdea}`);
  lines.push(
    'The mark must work as a solid black mark on a plain white background: flat, no gradients, no text, readable at small sizes.',
    "Pick a stickerSurface: a common, photographable flat surface from the brand's world for its sticker (generic nouns like \"wooden table\" or \"concrete wall\" find the best photos).",
    "Also write a short type specimen in the brand's voice: a headline (max 6 words, not the brand name) and one body sentence (max 20 words) that this brand would really say.",
    'Keep every caption short and visual. No marketing fluff.'
  );
  return lines.join('\n');
}

export async function generateDirectionConcept(brief: DirectionBrief): Promise<DirectionConcept> {
  // Lazy: the Genkit instance requires ANTHROPIC_API_KEY at import time.
  const { ai } = await import('@/ai/genkit');
  const res = await withTimeout(
    ai.generate({ prompt: buildDirectionConceptPrompt(brief), output: { schema: DirectionConceptSchema } }),
    45_000,
    'Concept generation'
  );
  if (!res.output) throw new Error('Concept generation returned no output');
  return res.output;
}
