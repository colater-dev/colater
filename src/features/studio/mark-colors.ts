import type { PaletteColor } from './types';

const ORDER: PaletteColor['role'][] = ['primary', 'secondary', 'accent', 'ink'];

/** Palette colors a mark can be shown in on the color slide, in click order (background excluded). */
export function markColorOptions(palette: PaletteColor[]): PaletteColor[] {
  return ORDER.map(role => palette.find(c => c.role === role)).filter((c): c is PaletteColor => !!c);
}
