import { describe, it, expect } from 'vitest';
import { variationTiles, typeLevels, markSlideColors } from '../slide-specs';
import type { PaletteColor } from '../types';

const p = (role: string, hex: string) => ({ role, hex, name: role }) as never;
const palette = [p('primary', '#1144AA'), p('secondary', '#22AA66'), p('accent', '#FFAA00'), p('background', '#F7F7F2'), p('ink', '#111111')];

describe('variationTiles', () => {
  it('shows six variations using the palette when there is one', () => {
    const t = variationTiles(palette);
    expect(t).toHaveLength(6);
    expect(t.map(x => x.label)).toEqual(['Positive', 'Negative', 'Primary on light', 'Light on primary', 'On photography', 'One colour']);
    expect(t[2]).toMatchObject({ background: '#F7F7F2', ink: '#1144AA' });
    expect(t[3]).toMatchObject({ background: '#1144AA', ink: '#F7F7F2' });
    expect(t[4].photo).toBe(true);
  });
  it('falls back to black, white and grey without a palette', () => {
    const t = variationTiles(undefined);
    expect(t).toHaveLength(6);
    expect(t[2]).toMatchObject({ background: '#F2F2F2', ink: '#111111' });
    expect(t[3]).toMatchObject({ background: '#111111', ink: '#F2F2F2' });
  });
});

describe('typeLevels', () => {
  it('builds display / subhead / body / caption from the brand copy', () => {
    const l = typeLevels({ name: 'Tidepool', sample: { headline: 'Little splashes, big confidence', body: 'We make the water feel like home.' }, tagline: 'Float together', fontName: 'Caprasimo' });
    expect(l.map(x => x.role)).toEqual(['Display', 'Subhead', 'Body', 'Caption']);
    expect(l[0].text).toBe('Little splashes, big confidence');
    expect(l[1].text).toBe('Float together');
    expect(l[2].text).toBe('We make the water feel like home.');
    expect(l[3].text).toBe('Caprasimo · Geist Sans');
  });
  it('falls back to the brand name when generated copy is missing', () => {
    const l = typeLevels({ name: 'Tidepool', fontName: 'Archivo' });
    expect(l[0].text).toBe('Tidepool');
    expect(l.map(x => x.role)).toEqual(['Display', 'Caption']);
  });
});

describe('markSlideColors', () => {
  it('puts the mark in primary and the name in ink on the palette background', () => {
    const p: PaletteColor[] = [
      { role: 'primary', hex: '#2244AA', name: 'Primary' },
      { role: 'background', hex: '#F7F1E8', name: 'Background' },
      { role: 'ink', hex: '#1A1A1A', name: 'Ink' },
    ];
    expect(markSlideColors(p)).toEqual({ background: '#F7F1E8', mark: '#2244AA', text: '#1A1A1A' });
  });
  it('falls back to black on white without a palette', () => {
    expect(markSlideColors(undefined)).toEqual({ background: '#FFFFFF', mark: undefined, text: '#000000' });
  });
});
