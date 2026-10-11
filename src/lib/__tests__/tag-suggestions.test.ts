import { describe, it, expect } from 'vitest';
import { buildTagQuestions, selectSuggestedTags } from '../tag-suggestions';
import { AUDIENCE_TAGS, STYLE_TAGS } from '../brand-tags';

describe('buildTagQuestions', () => {
  it('asks one boolean question per tag', () => {
    const q = buildTagQuestions();
    expect(Object.keys(q)).toHaveLength(AUDIENCE_TAGS.length + STYLE_TAGS.length);
    expect(q['audience__gen_z']).toEqual({ type: 'boolean', instructions: 'Is "Gen Z" a fitting target audience for this brand?' });
    expect(q['style__playful']).toEqual({ type: 'boolean', instructions: "Should this brand's visual identity feel playful?" });
  });
});

describe('selectSuggestedTags', () => {
  const b = (p: number) => ({ type: 'boolean' as const, probability: p });
  it('keeps tags at or above the threshold, highest first, max 3 per group', () => {
    const answers = {
      audience__gen_z: b(0.9), audience__students: b(0.6), audience__creatives: b(0.75),
      audience__families: b(0.65), audience__enterprise: b(0.05),
      style__playful: b(0.88), style__corporate_typo: b(0.99), style__serious: b(0.1),
    };
    expect(selectSuggestedTags(answers)).toMatchObject({
      audience: ['gen_z', 'creatives', 'families'],
      style: ['playful'],
    });
  });
  it('ignores unknown keys and non-boolean answers', () => {
    expect(selectSuggestedTags({ weird: b(1), style__bold: { type: 'choice', choice: 'x' } })).toEqual({ audience: [], style: [], scores: {} });
  });
});

describe('selectSuggestedTags scores', () => {
  const b = (p: number) => ({ type: 'boolean' as const, probability: p });
  it('returns a fit score for every known tag, including ones below the threshold', () => {
    const r = selectSuggestedTags({ audience__gen_z: b(0.9), audience__enterprise: b(0.05), style__calm: b(0.4), style__made_up: b(1) });
    expect(r.scores).toEqual({ gen_z: 0.9, enterprise: 0.05, calm: 0.4 });
  });
});
