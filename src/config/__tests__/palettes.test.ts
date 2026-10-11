import { describe, it, expect } from 'vitest';
import { PALETTES, PALETTE_GROUPS } from '../palettes';
import { contrastRatio } from '@/lib/contrast';

describe('palette library', () => {
  it('has 8 groups of 32 with unique names', () => {
    expect(PALETTE_GROUPS).toHaveLength(8);
    for (const g of PALETTE_GROUPS) expect(PALETTES.filter(p => p.group === g.id)).toHaveLength(32);
    expect(new Set(PALETTES.map(p => p.name.toLowerCase())).size).toBe(256);
  });
  it('every palette is valid hex and readable', () => {
    for (const p of PALETTES) {
      for (const hex of Object.values(p.colors)) expect(hex).toMatch(/^#[0-9A-F]{6}$/);
      expect(contrastRatio(p.colors.primary, p.colors.background)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(p.colors.ink, p.colors.background)).toBeGreaterThanOrEqual(7);
    }
  });
});
