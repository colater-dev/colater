import { describe, it, expect } from 'vitest';
import { buildDirectionConceptPrompt } from '../direction-concept';

const brief = {
  name: 'Broad City', pitch: 'A neighbourhood comedy podcast.',
  audienceTags: ['gen_z'], styleTags: ['playful', 'bold'],
  recipe: { ideaType: 'negative-space' as const, styleLean: 'playful', model: 'recraft' as const },
};

describe('buildDirectionConceptPrompt', () => {
  it('includes brand, tag labels, idea-type guidance and the style lean', () => {
    const p = buildDirectionConceptPrompt(brief);
    expect(p).toContain('Broad City');
    expect(p).toContain('A neighbourhood comedy podcast.');
    expect(p).toContain('Gen Z');
    expect(p).toContain('Playful, Bold');
    expect(p).toContain('second meaningful shape appears in the empty space');
    expect(p).toContain('Lean especially playful');
    expect(p).toContain('solid black mark on a plain white background');
  });
  it('adds feedback and seed idea when present', () => {
    const p = buildDirectionConceptPrompt({ ...brief, feedbackChips: ['less literal'], seedIdea: 'Two overlapping speech bubbles' });
    expect(p).toContain('Feedback on previous directions: less literal');
    expect(p).toContain('Explore a variation of this earlier direction: Two overlapping speech bubbles');
  });
});
