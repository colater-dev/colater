import { hexToRgb, rgbToHsl, hslToRgb, rgbToHex } from './color-utils';

function luminance(hex: string): number {
  const rgb = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

/** WCAG 2 contrast ratio between two hex colors (1–21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Adjusts `color`'s lightness (keeping hue and saturation) until it reaches `min` contrast against `background`. */
export function ensureContrast(color: string, background: string, min: number): string {
  if (contrastRatio(color, background) >= min) return color;
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  const [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const darken = luminance(background) > 0.18;
  for (let step = 1; step <= 100; step++) {
    const next = Math.min(1, Math.max(0, darken ? l - step / 100 : l + step / 100));
    const candidate = rgbToHex(...hslToRgb(h, s, next));
    if (contrastRatio(candidate, background) >= min) return candidate.toUpperCase();
    if (next === 0 || next === 1) break;
  }
  return darken ? '#000000' : '#FFFFFF';
}
