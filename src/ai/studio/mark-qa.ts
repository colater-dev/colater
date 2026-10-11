import { z } from 'genkit';
import type { LogoProvider } from '@/ai/logo-models';
import { withTimeout } from '@/lib/with-timeout';

export const MarkQaSchema = z.object({
  score: z.number().min(1).max(10).describe('Overall quality as a logo mark, 1-10, judged against the best marks in a curated logo gallery.'),
  hasWords: z.boolean().describe('Contains words or more than two letters.'),
  hasTextureOrShading: z.boolean().describe('Has texture, brush strokes, grain, hatching, shading or gradients instead of flat fills.'),
  tooDetailed: z.boolean().describe('Is an illustration or scene with small details that would be lost at 16px.'),
  mergesSeveralIdeas: z.boolean().describe('Crams several objects or metaphors together instead of one clear idea.'),
  resemblesHateSymbol: z.boolean().describe('Could be read as a swastika or another hate or extremist symbol.'),
  fix: z.string().describe('One short instruction that would most improve the next attempt, or empty.'),
});
export type MarkQa = z.infer<typeof MarkQaSchema>;

type Image = { buffer: Buffer; contentType: string };

const FLAGS: [keyof MarkQa, string][] = [
  ['hasWords', 'contains words'],
  ['hasTextureOrShading', 'has texture or shading'],
  ['tooDetailed', 'too detailed to read small'],
  ['mergesSeveralIdeas', 'merges several ideas'],
  ['resemblesHateSymbol', 'resembles a hate symbol'],
];

export function qaProblems(qa: MarkQa): string[] {
  const problems = FLAGS.filter(([k]) => qa[k] === true).map(([, label]) => label);
  if (qa.score < 5) problems.push(`weak overall (${qa.score}/10)`);
  return problems;
}

/** Claude looks at the cleaned mark and flags what a logo designer would reject. */
export async function checkMark(image: Image): Promise<MarkQa> {
  const { ai } = await import('@/ai/genkit');
  const res = await withTimeout(
    ai.generate({
      prompt: [
        { media: { url: `data:${image.contentType};base64,${image.buffer.toString('base64')}`, contentType: image.contentType } },
        { text: 'You are a strict senior logo designer reviewing a black-on-white logo mark before it is shown to a client. Judge it as a mark (no wordmark expected). Be honest; most AI marks are a 4-6.' },
      ],
      output: { schema: MarkQaSchema },
    }),
    30_000,
    'Mark check'
  );
  if (!res.output) throw new Error('Mark check returned no output');
  return res.output;
}

/**
 * Renders a mark, cleans it, and has it checked. A mark with problems is re-rendered once with the
 * problems spelled out, and the better of the two is kept. A hate-symbol lookalike is never kept.
 * A failing check never blocks the mark.
 */
export async function renderCheckedMark(
  deps: {
    render(provider: LogoProvider, prompt: string): Promise<Image>;
    clean(image: Image): Promise<Image>;
    check(image: Image): Promise<MarkQa>;
  },
  provider: LogoProvider,
  prompt: string
): Promise<Image & { qa?: MarkQa }> {
  const attempt = async (p: string) => {
    const image = await deps.clean(await deps.render(provider, p));
    const qa = await deps.check(image).catch(error => {
      console.error('[studio] mark check failed, keeping the mark:', error);
      return undefined;
    });
    return { ...image, qa };
  };

  const first = await attempt(prompt);
  if (!first.qa) return first;
  const problems = qaProblems(first.qa);
  if (!problems.length) return first;

  const fix = [`Avoid: ${problems.join(', ')}.`, first.qa.fix].filter(Boolean).join(' ');
  const second = await attempt(`${prompt} ${fix}`);
  const candidates = [first, second].filter(c => !c.qa?.resemblesHateSymbol);
  if (!candidates.length) throw new Error("Couldn't draw a safe mark for this idea");
  return candidates.reduce((best, c) => ((c.qa?.score ?? 5) > (best.qa?.score ?? 5) ? c : best));
}
