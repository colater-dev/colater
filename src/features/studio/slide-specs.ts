import type { PaletteColor } from './types';

export interface VariationTile {
  label: string;
  background: string;
  ink: string;
  photo?: boolean;
}

/** The six logo variations on the variations sheet, from the palette when there is one. */
export function variationTiles(palette: PaletteColor[] | undefined): VariationTile[] {
  const c = Object.fromEntries((palette ?? []).map(p => [p.role, p.hex])) as Partial<Record<PaletteColor['role'], string>>;
  const primary = c.primary ?? '#111111';
  const light = c.background ?? '#F2F2F2';
  const ink = c.ink ?? '#111111';
  return [
    { label: 'Positive', background: '#FFFFFF', ink: '#000000' },
    { label: 'Negative', background: '#000000', ink: '#FFFFFF' },
    { label: 'Primary on light', background: light, ink: primary },
    { label: 'Light on primary', background: primary, ink: light },
    { label: 'On photography', background: '#000000', ink: '#FFFFFF', photo: true },
    { label: 'One colour', background: light, ink },
  ];
}

export interface TypeLevel {
  role: 'Display' | 'Subhead' | 'Body' | 'Caption';
  text: string;
}

/** Type hierarchy levels from the brand's own copy; levels without copy are skipped. */
export function typeLevels({ name, sample, tagline, fontName }: {
  name: string;
  sample?: { headline: string; body: string };
  tagline?: string;
  fontName: string;
}): TypeLevel[] {
  const levels: TypeLevel[] = [{ role: 'Display', text: sample?.headline ?? name }];
  const subhead = tagline ?? (sample ? name : undefined);
  if (subhead) levels.push({ role: 'Subhead', text: subhead });
  if (sample?.body) levels.push({ role: 'Body', text: sample.body });
  levels.push({ role: 'Caption', text: `${fontName} · Geist Sans` });
  return levels;
}

/** Colors for the mark and lockup slides: mark in primary, name in ink, on the palette background. */
export function markSlideColors(palette: PaletteColor[] | undefined): { background: string; mark?: string; text: string } {
  const hex = (role: PaletteColor['role']) => palette?.find(c => c.role === role)?.hex;
  return { background: hex('background') ?? '#FFFFFF', mark: hex('primary'), text: hex('ink') ?? '#000000' };
}
