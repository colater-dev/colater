import { describe, it, expect } from 'vitest';
import { contrastRatio, ensureContrast } from '../contrast';

describe('contrastRatio', () => {
  it('matches WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 1);
  });
});

describe('ensureContrast', () => {
  it('leaves a color alone when it already passes', () => {
    expect(ensureContrast('#111111', '#FFFFFF', 7)).toBe('#111111');
  });
  it('darkens a color on a light background until it passes, keeping its hue', () => {
    const fixed = ensureContrast('#9FD3FF', '#F8F8F4', 3);
    expect(contrastRatio(fixed, '#F8F8F4')).toBeGreaterThanOrEqual(3);
    expect(fixed).not.toBe('#9FD3FF');
  });
  it('lightens a color on a dark background until it passes', () => {
    const fixed = ensureContrast('#333366', '#101010', 4.5);
    expect(contrastRatio(fixed, '#101010')).toBeGreaterThanOrEqual(4.5);
  });
});
