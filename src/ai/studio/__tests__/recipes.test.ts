import { describe, it, expect } from 'vitest';
import { pickRecipes, IDEA_TYPES, IDEA_TYPE_GUIDANCE } from '../recipes';
import { LOGO_MODELS } from '@/ai/logo-models';

function seeded(seed: number) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

describe('pickRecipes', () => {
  it('returns 3 recipes with 3 different models and 3 different idea types', () => {
    for (let s = 1; s < 50; s++) {
      const r = pickRecipes(['playful', 'bold'], seeded(s));
      expect(r).toHaveLength(3);
      expect(new Set(r.map(x => x.model))).toEqual(new Set(Object.keys(LOGO_MODELS)));
      expect(new Set(r.map(x => x.ideaType)).size).toBe(3);
      for (const x of r) expect(IDEA_TYPES).toContain(x.ideaType);
    }
  });
  it('spreads style leans across the chosen tags', () => {
    const r = pickRecipes(['playful', 'bold', 'warm'], seeded(3));
    expect(new Set(r.map(x => x.styleLean))).toEqual(new Set(['playful', 'bold', 'warm']));
  });
  it('falls back to minimal when no style tags are given', () => {
    expect(pickRecipes([], seeded(1)).every(x => x.styleLean === 'minimal')).toBe(true);
  });
  it('returns a single recipe when asked for one, avoiding recently used idea/model combos', () => {
    const recent = [
      { ideaType: 'lettermark' as const, model: 'recraft' as const },
      { ideaType: 'negative-space' as const, model: 'recraft' as const },
      { ideaType: 'literal-symbol' as const, model: 'recraft' as const },
    ];
    for (let s = 1; s < 30; s++) {
      const r = pickRecipes(['calm'], seeded(s), { count: 1, avoid: recent });
      expect(r).toHaveLength(1);
      expect(recent.some(x => x.ideaType === r[0].ideaType && x.model === r[0].model)).toBe(false);
    }
  });
});

describe('idea types', () => {
  it('include monoline, mascot and modular constructions alongside the originals', () => {
    for (const t of ['literal-symbol', 'abstract-geometric', 'lettermark', 'negative-space', 'monoline', 'mascot', 'modular']) expect(IDEA_TYPES).toContain(t);
  });
  it('only the mascot type invites a character with a face', () => {
    expect(IDEA_TYPE_GUIDANCE.mascot).toMatch(/character/i);
    expect(IDEA_TYPE_GUIDANCE.monoline).toMatch(/even|uniform/i);
    expect(IDEA_TYPE_GUIDANCE.monoline).toMatch(/8%/);
    expect(IDEA_TYPE_GUIDANCE.modular).toMatch(/stripes|dots|layers/i);
  });
});
