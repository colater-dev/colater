import { z } from 'genkit';
import { tagLabel } from '@/lib/brand-tags';
import { withTimeout } from '@/lib/with-timeout';
import type { PaletteColor } from '@/features/studio/types';

export interface SlideBrief {
  name: string;
  pitch: string;
  audienceTags: string[];
  styleTags: string[];
  idea: string;
  feedback?: { chips: string[]; note?: string };
}

export function feedbackLine(f?: SlideBrief['feedback']): string | null {
  if (!f || (!f.chips.length && !f.note)) return null;
  return `Feedback: ${f.chips.join(', ')}${f.note ? `. Note: ${f.note}` : ''}`;
}

const ROLES = ['primary', 'secondary', 'accent', 'background', 'ink'] as const;

export const PaletteSchema = z.object({
  colors: z.array(z.object({
    hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    name: z.string().describe('Evocative 1-3 word color name'),
    role: z.enum(ROLES),
  })).length(5),
});

export function buildPalettePrompt(b: SlideBrief): string {
  const lines = [
    'You are a brand designer choosing a color palette for a logo direction.',
    `Brand: ${b.name}`,
    `What it does: ${b.pitch}`,
    `Audience: ${b.audienceTags.map(tagLabel).join(', ')}`,
    `Style: ${b.styleTags.map(tagLabel).join(', ')}`,
    `Logo idea: ${b.idea}`,
    'Return exactly five colors, one per role: primary (the mark color), secondary, accent, background (light, for slides), ink (dark, for text).',
    'Primary must read clearly on background. Hex as #RRGGBB.',
  ];
  const fb = feedbackLine(b.feedback);
  if (fb) lines.push(fb);
  return lines.join('\n');
}

export async function generatePalette(b: SlideBrief): Promise<PaletteColor[]> {
  const { ai } = await import('@/ai/genkit');
  const res = await withTimeout(ai.generate({ prompt: buildPalettePrompt(b), output: { schema: PaletteSchema } }), 45_000, 'Palette generation');
  if (!res.output) throw new Error('Palette generation returned no output');
  return ROLES.map(role => res.output!.colors.find(c => c.role === role) ?? res.output!.colors[ROLES.indexOf(role)]);
}
