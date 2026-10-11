import { describe, it, expect } from 'vitest';
import { pickRecipes, IDEA_TYPES } from '../recipes';
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
});
