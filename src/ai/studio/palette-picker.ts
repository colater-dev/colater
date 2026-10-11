import { jevEvaluate, type JevAnswer, type JevQuestion } from '@/ai/jev';
import { PALETTES, PALETTE_GROUPS, type LibraryPalette, type PaletteGroupId } from '@/config/palettes';
import { ensureContrast } from '@/lib/contrast';
import { hexToRgb, rgbToHsl, hslToRgb, rgbToHex } from '@/lib/color-utils';
import type { PaletteColor } from '@/features/studio/types';

type JevFn = (state: unknown, questions: Record<string, JevQuestion>) => Promise<Record<string, JevAnswer>>;
type Colors = LibraryPalette['colors'];
const ROLES = ['primary', 'secondary', 'accent', 'background', 'ink'] as const;

export function buildGroupQuestion(): JevQuestion {
  const criteria: Record<string, string> = {};
  for (const g of PALETTE_GROUPS) criteria[g.id] = `${g.label}: ${g.description}`;
  return { type: 'choice', instructions: 'Which color mood best suits this brand and logo direction?', criteria };
}

export function buildPaletteQuestion(group: PaletteGroupId, exclude: string[]): JevQuestion {
  const criteria: Record<string, string> = {};
  for (const p of PALETTES) if (p.group === group && !exclude.includes(p.name)) criteria[p.name] = p.tags.join(', ');
  return { type: 'choice', instructions: 'Which named color palette best suits this brand and logo direction?', criteria };
}

function adjust(hex: string, hueDeg: number, dLight: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const nh = (((h + hueDeg / 360) % 1) + 1) % 1;
  const nl = Math.min(0.95, Math.max(0.05, l + dLight));
  return rgbToHex(...hslToRgb(nh, s, nl)).toUpperCase();
}

/** Shifts a palette's shades a little (hue ±6–10°, lightness ±5%) while keeping it readable. */
export function jitterPalette(colors: Colors, random: () => number = Math.random): Colors {
  const hue = (6 + random() * 4) * (random() < 0.5 ? -1 : 1);
  const light = (random() * 0.1) - 0.05;
  const background = colors.background;
  return {
    primary: ensureContrast(adjust(colors.primary, hue, light), background, 3),
    secondary: adjust(colors.secondary, hue, light),
    accent: adjust(colors.accent, hue, light),
    background,
    ink: ensureContrast(colors.ink, background, 7),
  };
}

function toPaletteColors(colors: Colors): PaletteColor[] {
  return ROLES.map(role => ({ role, hex: colors[role], name: role[0].toUpperCase() + role.slice(1) }));
}

/** Jev picks a mood group, then a palette in it; repeats on the same page get nudged shades. */
export async function choosePalette({ state, used, exclude = [], jev = jevEvaluate, random = Math.random }: {
  state: object;
  used: string[];
  exclude?: string[];
  jev?: JevFn;
  random?: () => number;
}): Promise<{ name: string; colors: PaletteColor[] }> {
  const candidates = (g?: PaletteGroupId) => PALETTES.filter(p => (!g || p.group === g) && !exclude.includes(p.name));
  let chosen: LibraryPalette | undefined;
  try {
    const g = (await jev(state, { group: buildGroupQuestion() })).group;
    const group = g?.type === 'choice' && PALETTE_GROUPS.some(x => x.id === g.choice) ? (g.choice as PaletteGroupId) : undefined;
    if (group) {
      const p = (await jev(state, { palette: buildPaletteQuestion(group, exclude) })).palette;
      chosen = candidates(group).find(x => p?.type === 'choice' && x.name === p.choice);
      if (!chosen) {
        const pool = candidates(group);
        chosen = pool[Math.floor(random() * pool.length)];
      }
    }
  } catch (error) {
    console.error('[palette] Jev failed, using a random library palette:', error);
  }
  if (!chosen) {
    const pool = candidates();
    chosen = pool[Math.floor(random() * pool.length)] ?? PALETTES[0];
  }
  const colors = used.includes(chosen.name) ? jitterPalette(chosen.colors, random) : chosen.colors;
  return { name: chosen.name, colors: toPaletteColors(colors) };
}
