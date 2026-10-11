import { describe, it, expect } from 'vitest';
import { lockupLayout, capCenterShift, fitScale } from '../lockup-layout';

const solid = 0.6;

describe('lockupLayout (units: cap heights)', () => {
  it('a square solid mark is about 1.8 cap heights with a 0.6 gap', () => {
    const l = lockupLayout({ aspect: 1, density: solid });
    expect(l.markHeight).toBeCloseTo(1.8, 2);
    expect(l.markWidth).toBeCloseTo(1.8, 2);
    expect(l.gap).toBe(0.6);
  });
  it('a wide mark is shorter but wider than a square one (similar optical area)', () => {
    const sq = lockupLayout({ aspect: 1, density: solid });
    const wide = lockupLayout({ aspect: 2, density: solid });
    expect(wide.markHeight).toBeLessThan(sq.markHeight);
    expect(wide.markWidth).toBeGreaterThan(sq.markWidth);
  });
  it('a tall mark is taller, but never more than 2.4 cap heights', () => {
    expect(lockupLayout({ aspect: 0.6, density: solid }).markHeight).toBeGreaterThan(1.8);
    expect(lockupLayout({ aspect: 0.2, density: solid }).markHeight).toBe(2.4);
  });
  it('a very wide mark never gets shorter than 1.1 cap heights or wider than 4.5', () => {
    const l = lockupLayout({ aspect: 3, density: solid });
    expect(l.markHeight).toBeGreaterThanOrEqual(1.1);
    expect(lockupLayout({ aspect: 8, density: solid }).markWidth).toBeLessThanOrEqual(4.5);
  });
  it('a sparse line mark is drawn a little larger than a solid one', () => {
    const sparse = lockupLayout({ aspect: 1, density: 0.15 }).markHeight;
    expect(sparse).toBeGreaterThan(1.8);
    expect(sparse).toBeLessThanOrEqual(1.8 * 1.15 + 1e-9);
  });
});

describe('capCenterShift', () => {
  it('moves text so the middle of its capitals sits at the middle of a 1em line box', () => {
    // baseline at (1 - 1.15)/2 + 0.9 = 0.825em; cap centre at 0.825 - 0.35 = 0.475em; box centre 0.5em.
    expect(capCenterShift({ ascent: 0.9, descent: 0.25, cap: 0.7 })).toBeCloseTo(0.025, 5);
  });
});

describe('fitScale', () => {
  it('shrinks only when the lockup is wider than the space', () => {
    expect(fitScale(200, 256)).toBe(1);
    expect(fitScale(320, 256)).toBeCloseTo(0.8, 5);
    expect(fitScale(0, 256)).toBe(1);
  });
  it('can grow a short lockup up to a limit when allowed', () => {
    expect(fitScale(100, 256, 1.3)).toBe(1.3);
    expect(fitScale(220, 256, 1.3)).toBeCloseTo(256 / 220, 5);
  });
});
