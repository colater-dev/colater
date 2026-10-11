import { describe, it, expect } from 'vitest';
import { buildFontQuestion } from '../pick-font';
import { BRAND_FONTS } from '@/config/brand-fonts';

describe('buildFontQuestion', () => {
  it('offers every brand font as a choice', () => {
    const q = buildFontQuestion();
    expect(q.type).toBe('choice');
    if (q.type !== 'choice') return;
    expect(Object.keys(q.criteria).sort()).toEqual(BRAND_FONTS.map(f => f.name).sort());
  });
});
