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
  /** Ideas already on the brand's page; the new direction should differ from all of them. */
  avoidIdeas?: string[];
}

export const DirectionConceptSchema = z.object({
  idea: z.string().describe('The core idea of the mark in one short sentence (max 12 words).'),
  rationale: z.string().describe('Why it fits the brand, max 20 words.'),
  markPrompt: z.string().describe('Visual-only prompt for an image model describing concrete geometry: which 2-4 shapes, their proportions and positions, stroke weight. Not the metaphor. No brand name, no words in the image.'),
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
    'You are a veteran brand designer creating ONE logo direction, at the level of the best marks in a curated logo gallery: confident, simple, precise, with one clever idea.',
    `Brand: ${b.name}`,
    `What it does: ${b.pitch}`,
    `Audience: ${b.audienceTags.map(tagLabel).join(', ') || 'general'}`,
    `Style: ${b.styleTags.map(tagLabel).join(', ') || 'Minimal'}`,
    `Idea type for this direction: ${IDEA_TYPE_GUIDANCE[b.recipe.ideaType]}`,
    `Lean especially ${tagLabel(b.recipe.styleLean).toLowerCase()}.`,
  ];
  if (b.feedbackChips?.length) lines.push(`Feedback on previous directions: ${b.feedbackChips.join(', ')}`);
  if (b.seedIdea) lines.push(`Explore a variation of this earlier direction: ${b.seedIdea}`);
  const avoid = (b.avoidIdeas ?? []).filter(i => i && i !== b.seedIdea);
  if (avoid.length) {
    lines.push('Already on the page (do something clearly different: a different subject, metaphor and silhouette):', ...avoid.map(i => `- ${i}`));
  }
  lines.push(
    'Rules for the idea:',
    '- ONE idea, one metaphor. Never merge two objects ("X morphing into Y") or stack a hidden shape on top of another trick.',
    '- Built from 2-4 bold shapes (or one confident, even, thick stroke). It must still read as a 16px favicon: no thin lines, no small details, no scenes.',
    b.recipe.ideaType === 'mascot'
      ? '- The character is the idea: one quirky, memorable attitude, built from simple geometric shapes with bold uniform outlines. Not a smiley stuck on an object.'
      : '- No faces, eyes, smiles or mascot expressions. Friendliness comes from rounded geometry and proportion.',
    "- Name to yourself the obvious cliché for this category (gears for automation, nodes for AI, dumbbells for fitness, coffee cups for cafés) and don't draw it literally. Find an unexpected subject, angle or reduction.",
    '- Avoid anything resembling a swastika, pinwheel of hooked arms, or other hate or loaded symbols, religious symbols, flags, or well-known existing logos.',
    'The mark must work as a solid black mark on a plain white background: flat, no gradients, no texture, no text, readable at small sizes.',
    'Write the markPrompt as concrete geometry for an image model: which shapes, their proportions and positions, stroke weight. Give exact counts and say what is symmetric or evenly spaced. Describe what to draw, not what it means.',
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
