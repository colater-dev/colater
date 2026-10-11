import { describe, it, expect, vi } from 'vitest';
import { buildGroupQuestion, buildPaletteQuestion, choosePalette, jitterPalette } from '../palette-picker';
import { PALETTES } from '@/config/palettes';
import { contrastRatio } from '@/lib/contrast';

const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const choice = (choiceName: string) => ({ type: 'choice' as const, choice: choiceName });

describe('questions', () => {
  it('asks for one of 8 groups, then one of 32 palettes in that group', () => {
    const g = buildGroupQuestion();
    expect(g.type === 'choice' && Object.keys(g.criteria)).toHaveLength(8);
    const p = buildPaletteQuestion('calm', []);
    expect(p.type === 'choice' && Object.keys(p.criteria)).toHaveLength(32);
  });
  it('can exclude palettes (for re-picks)', () => {
    const first = PALETTES.find(x => x.group === 'calm')!.name;
    const p = buildPaletteQuestion('calm', [first]);
    expect(p.type === 'choice' && Object.keys(p.criteria)).not.toContain(first);
  });
});

describe('choosePalette', () => {
  const target = PALETTES.find(x => x.group === 'retro')!;
  const jev = vi.fn()
    .mockResolvedValueOnce({ group: choice('retro') })
    .mockResolvedValueOnce({ palette: choice(target.name) });

  it('picks a group then a palette and returns five role colors', async () => {
    const r = await choosePalette({ state: {}, used: [], jev, random: seeded(1) });
    expect(r.name).toBe(target.name);
    expect(r.colors.map(c => c.role)).toEqual(['primary', 'secondary', 'accent', 'background', 'ink']);
    expect(r.colors[0].hex).toBe(target.colors.primary);
  });

  it('nudges shades when the palette is already used on the page', async () => {
    const again = vi.fn()
      .mockResolvedValueOnce({ group: choice('retro') })
      .mockResolvedValueOnce({ palette: choice(target.name) });
    const r = await choosePalette({ state: {}, used: [target.name], jev: again, random: seeded(7) });
    expect(r.name).toBe(target.name);
    expect(r.colors[0].hex).not.toBe(target.colors.primary);
  });

  it('falls back to a library palette when Jev fails', async () => {
    const broken = vi.fn().mockRejectedValue(new Error('down'));
    const r = await choosePalette({ state: {}, used: [], jev: broken, random: seeded(3) });
    expect(PALETTES.some(p => p.name === r.name)).toBe(true);
  });
});

describe('jitterPalette', () => {
  it('changes shades but keeps the palette readable', () => {
    for (const p of PALETTES.slice(0, 40)) {
      const j = jitterPalette(p.colors, seeded(11));
      expect(j).not.toEqual(p.colors);
      expect(contrastRatio(j.primary, j.background)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(j.ink, j.background)).toBeGreaterThanOrEqual(7);
    }
  });
});
