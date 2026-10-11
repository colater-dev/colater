import type { JevAnswer, JevQuestion } from '@/ai/jev';
import { AUDIENCE_TAGS, STYLE_TAGS, isTagInGroup, type TagGroup } from './brand-tags';

export function buildTagQuestions(): Record<string, JevQuestion> {
  const questions: Record<string, JevQuestion> = {};
  for (const t of AUDIENCE_TAGS) {
    questions[`audience__${t.id}`] = { type: 'boolean', instructions: `Is "${t.label}" a fitting target audience for this brand?` };
  }
  for (const t of STYLE_TAGS) {
    questions[`style__${t.id}`] = { type: 'boolean', instructions: `Should this brand's visual identity feel ${t.label.toLowerCase()}?` };
  }
  return questions;
}

export function selectSuggestedTags(
  answers: Record<string, JevAnswer>,
  { threshold = 0.6, max = 3 }: { threshold?: number; max?: number } = {}
): { audience: string[]; style: string[]; scores: Record<string, number> } {
  const scored: Record<TagGroup, { id: string; p: number }[]> = { audience: [], style: [] };
  const scores: Record<string, number> = {};
  for (const [key, answer] of Object.entries(answers)) {
    const [group, id] = key.split('__') as [TagGroup, string];
    if ((group !== 'audience' && group !== 'style') || !id || !isTagInGroup(group, id)) continue;
    if (answer.type !== 'boolean') continue;
    scores[id] = answer.probability;
    if (answer.probability < threshold) continue;
    scored[group].push({ id, p: answer.probability });
  }
  const top = (list: { id: string; p: number }[]) => list.sort((a, b) => b.p - a.p).slice(0, max).map(x => x.id);
  return { audience: top(scored.audience), style: top(scored.style), scores };
}
