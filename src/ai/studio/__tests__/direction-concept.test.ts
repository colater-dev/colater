import { describe, it, expect } from 'vitest';
import { buildDirectionConceptPrompt, DirectionConceptSchema } from '../direction-concept';

const brief = {
  name: 'Broad City', pitch: 'A neighbourhood comedy podcast.',
  audienceTags: ['gen_z'], styleTags: ['playful', 'bold'],
  recipe: { ideaType: 'negative-space' as const, styleLean: 'playful', model: 'recraft' as const },
};

describe('buildDirectionConceptPrompt', () => {
  it('asks for one idea that survives at favicon size, with no faces or category clichés', () => {
    const p = buildDirectionConceptPrompt(brief);
    expect(p).toContain('ONE idea');
    expect(p).toContain('16px');
    expect(p).toMatch(/no faces/i);
    expect(p).toMatch(/cliché/i);
  });
  it('a mascot direction may draw a character, others may not use faces', () => {
    const mascot = buildDirectionConceptPrompt({ ...brief, recipe: { ...brief.recipe, ideaType: 'mascot' } });
    expect(mascot).not.toMatch(/No faces/);
    expect(mascot).toMatch(/character/i);
    expect(buildDirectionConceptPrompt(brief)).toMatch(/No faces/);
  });
  it('asks for exact counts, symmetry and stroke weight in the markPrompt', () => {
    expect(buildDirectionConceptPrompt(brief)).toMatch(/exact counts/i);
  });
  it('steers clear of swastika-like and other loaded symbols', () => {
    expect(buildDirectionConceptPrompt(brief)).toMatch(/swastika/i);
  });
  it('asks for a markPrompt that describes concrete geometry rather than the metaphor', () => {
    expect(buildDirectionConceptPrompt(brief)).toMatch(/markPrompt.*geometry/i);
  });
  it('lists ideas already on the page so the new direction goes somewhere different', () => {
    const p = buildDirectionConceptPrompt({ ...brief, avoidIdeas: ['Nodes forming a checkmark', 'Rounded square nodes'] });
    expect(p).toContain('Already on the page');
    expect(p).toContain('- Nodes forming a checkmark');
    expect(p).toContain('- Rounded square nodes');
  });
  it('says nothing about other ideas when there are none', () => {
    expect(buildDirectionConceptPrompt(brief)).not.toContain('Already on the page');
  });
  it('includes brand, tag labels, idea-type guidance and the style lean', () => {
    const p = buildDirectionConceptPrompt(brief);
    expect(p).toContain('Broad City');
    expect(p).toContain('A neighbourhood comedy podcast.');
    expect(p).toContain('Gen Z');
    expect(p).toContain('Playful, Bold');
    expect(p).toContain('ONE simple shape cut out of it');
    expect(p).toContain('Lean especially playful');
    expect(p).toContain('solid black mark on a plain white background');
  });
  it('adds feedback and seed idea when present', () => {
    const p = buildDirectionConceptPrompt({ ...brief, feedbackChips: ['less literal'], seedIdea: 'Two overlapping speech bubbles' });
    expect(p).toContain('Feedback on previous directions: less literal');
    expect(p).toContain('Explore a variation of this earlier direction: Two overlapping speech bubbles');
  });
  it('asks for a brand-voiced type specimen', () => {
    expect(buildDirectionConceptPrompt(brief)).toContain('type specimen');
  });
  it('schema requires a type sample with headline and body', () => {
    const base = { idea: 'i', rationale: 'r', markPrompt: 'p', captions: { mark: 'm', lockup: 'l', inUse: 'u' } };
    expect(DirectionConceptSchema.safeParse(base).success).toBe(false);
    expect(DirectionConceptSchema.safeParse({ ...base, stickerSurface: 'pool tiles', typeSample: { headline: 'Float together', body: 'Swim lessons built around calm.' } }).success).toBe(true);
  });
  it('asks for a photo-searchable surface for the sticker slide, and the schema requires it', () => {
    expect(buildDirectionConceptPrompt(brief)).toContain('sticker');
    const full = { idea: 'i', rationale: 'r', markPrompt: 'p', captions: { mark: 'm', lockup: 'l', inUse: 'u' }, typeSample: { headline: 'h', body: 'b' } };
    expect(DirectionConceptSchema.safeParse(full).success).toBe(false);
    expect(DirectionConceptSchema.safeParse({ ...full, stickerSurface: 'concrete wall' }).success).toBe(true);
  });
});
