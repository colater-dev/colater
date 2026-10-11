import { describe, it, expect } from 'vitest';
import { buildPalettePrompt, PaletteSchema } from '../palette';

const brief = { name: 'Tidepool', pitch: 'A calm swim school for toddlers.', audienceTags: ['families'], styleTags: ['calm', 'warm'], idea: 'Parent and child form a heart.' };

describe('palette', () => {
  it('prompt includes brand, idea, style labels, and the five roles', () => {
    const p = buildPalettePrompt(brief);
    for (const s of ['Tidepool', 'Parent and child form a heart.', 'Calm, Warm', 'primary', 'secondary', 'accent', 'background', 'ink']) expect(p).toContain(s);
  });
  it('prompt carries feedback when given', () => {
    expect(buildPalettePrompt({ ...brief, feedback: { chips: ['warmer'], note: 'less pink' } })).toContain('Feedback: warmer. Note: less pink');
  });
  it('schema requires exactly five #RRGGBB colors', () => {
    const c = (role: string) => ({ hex: '#1A2B3C', name: 'Deep', role });
    expect(PaletteSchema.safeParse({ colors: ['primary', 'secondary', 'accent', 'background', 'ink'].map(c) }).success).toBe(true);
    expect(PaletteSchema.safeParse({ colors: [c('primary')] }).success).toBe(false);
    expect(PaletteSchema.safeParse({ colors: ['primary', 'secondary', 'accent', 'background', 'ink'].map(r => ({ ...c(r), hex: 'blue' })) }).success).toBe(false);
  });
});
