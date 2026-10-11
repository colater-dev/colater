import { z } from 'genkit';
import { tagLabel } from '@/lib/brand-tags';
import { withTimeout } from '@/lib/with-timeout';
import { feedbackLine, type SlideBrief } from './palette';

export const VoiceSchema = z.object({
  tagline: z.string().describe('Tagline, max 8 words'),
  story: z.string().describe('What the brand stands for, one sentence, max 25 words'),
});

export function buildVoicePrompt(b: SlideBrief): string {
  const lines = [
    'You are a brand copywriter.',
    `Brand: ${b.name}`,
    `What it does: ${b.pitch}`,
    `Audience: ${b.audienceTags.map(tagLabel).join(', ')}`,
    `Style: ${b.styleTags.map(tagLabel).join(', ')}`,
    `Logo idea: ${b.idea}`,
    'Write a tagline (max 8 words) and a story of what the brand stands for in one sentence (max 25 words). Plain words, no clichés, do not repeat the brand name in the tagline.',
  ];
  const fb = feedbackLine(b.feedback);
  if (fb) lines.push(fb);
  return lines.join('\n');
}

export async function generateVoice(b: SlideBrief): Promise<{ tagline: string; story: string }> {
  const { ai } = await import('@/ai/genkit');
  const res = await withTimeout(ai.generate({ prompt: buildVoicePrompt(b), output: { schema: VoiceSchema } }), 45_000, 'Voice generation');
  if (!res.output) throw new Error('Voice generation returned no output');
  return res.output;
}
