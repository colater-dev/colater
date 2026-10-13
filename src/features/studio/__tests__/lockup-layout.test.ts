import { describe, it, expect } from 'vitest';
import { lockupLayout, stackedLayout, sparseBoost, nameBoost, capCenterShift, capTopInset, fitScale, fitBoxScale, nextLockupLayout, defaultLockupLayouts } from '../lockup-layout';

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
  it('a tall mark is taller, but never more than 2.8 cap heights', () => {
    expect(lockupLayout({ aspect: 0.6, density: solid }).markHeight).toBeGreaterThan(1.8);
    expect(lockupLayout({ aspect: 0.2, density: solid }).markHeight).toBe(2.8);
  });
  it('a very wide mark never gets shorter than 1.3 cap heights or wider than 5.5', () => {
    const l = lockupLayout({ aspect: 3, density: solid });
    expect(l.markHeight).toBeGreaterThanOrEqual(1.3);
    expect(lockupLayout({ aspect: 8, density: solid }).markWidth).toBeLessThanOrEqual(5.5);
  });
  it('a sparse line mark is drawn larger than a solid one, up to 40%', () => {
    const sparse = lockupLayout({ aspect: 1, density: 0.15 }).markHeight;
    expect(sparse).toBeGreaterThan(1.8 * 1.3);
    expect(sparse).toBeLessThanOrEqual(1.8 * 1.4 + 1e-9);
    expect(sparseBoost(0.9)).toBe(1);
    expect(sparseBoost(0.05)).toBe(1.4);
  });
  it('a wide sparse mark (a 3:1 monoline animal) comes out clearly bigger than before', () => {
    const l = lockupLayout({ aspect: 3.14, density: 0.24, nameLength: 17 });
    expect(l.markHeight).toBeGreaterThan(1.6);
    expect(l.markWidth).toBeLessThanOrEqual(5.5);
  });
  it('long names get a bigger mark so it is not a dot beside the word', () => {
    expect(nameBoost(8)).toBe(1);
    expect(nameBoost(4)).toBe(1);
    expect(nameBoost(18)).toBeCloseTo(1.3, 5);
    expect(nameBoost(40)).toBe(1.3);
    const short = lockupLayout({ aspect: 1, density: solid, nameLength: 8 }).markHeight;
    const long = lockupLayout({ aspect: 1, density: solid, nameLength: 18 }).markHeight;
    expect(long).toBeCloseTo(short * 1.3, 5);
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

describe('stackedLayout (units: cap heights)', () => {
  it('a square solid mark sits about 3.2 cap heights tall above the name, 0.8 apart', () => {
    const l = stackedLayout({ aspect: 1, density: solid });
    expect(l.markHeight).toBeCloseTo(3.2, 2);
    expect(l.gap).toBe(0.8);
  });
  it('is larger than the horizontal mark, since it has the full width to itself', () => {
    expect(stackedLayout({ aspect: 1, density: solid }).markHeight).toBeGreaterThan(lockupLayout({ aspect: 1, density: solid }).markHeight);
  });
  it('wide marks get shorter, tall marks taller, within limits', () => {
    expect(stackedLayout({ aspect: 2.5, density: solid }).markHeight).toBeLessThan(3.2);
    expect(stackedLayout({ aspect: 0.2, density: solid }).markHeight).toBe(4.2);
    expect(stackedLayout({ aspect: 10, density: solid }).markWidth).toBeLessThanOrEqual(7);
  });
});

describe('fitBoxScale', () => {
  it('uses whichever of width or height is tighter', () => {
    expect(fitBoxScale({ width: 100, height: 100 }, { width: 200, height: 50 }, 3)).toBeCloseTo(0.5, 5);
    expect(fitBoxScale({ width: 100, height: 10 }, { width: 150, height: 50 }, 3)).toBeCloseTo(1.5, 5);
  });
});

describe('nextLockupLayout', () => {
  it('cycles mark, horizontal, stacked', () => {
    expect(nextLockupLayout('mark')).toBe('horizontal');
    expect(nextLockupLayout('horizontal')).toBe('stacked');
    expect(nextLockupLayout('stacked')).toBe('mark');
  });
});

describe('defaultLockupLayouts', () => {
  it('starts short names on mark + horizontal and long names on mark + stacked', () => {
    expect(defaultLockupLayouts('Tidepool')).toEqual(['mark', 'horizontal']);
    expect(defaultLockupLayouts('Quiet Art Movement')).toEqual(['mark', 'stacked']);
    expect(defaultLockupLayouts('  Synthetic Clothes  ')).toEqual(['mark', 'stacked']);
  });
});

describe('capTopInset', () => {
  it('is the empty space above the capitals in a 1em line box', () => {
    // half-leading (1 - 1.15)/2 = -0.075, baseline at 0.825, cap top at 0.825 - 0.7 = 0.125em.
    expect(capTopInset({ ascent: 0.9, descent: 0.25, cap: 0.7 })).toBeCloseTo(0.125, 5);
  });
});
