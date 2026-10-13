const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Sparse marks (outlines, monolines, thin modules) carry less ink per area than solid ones, so
 * at equal size they look weaker. Measured marks range from ~0.13 (a thin ring) to ~0.9 density;
 * this grows the sparsest ones by up to 40%.
 */
export function sparseBoost(density: number): number {
  return clamp(1 + (0.45 - density) * 1.2, 1, 1.4);
}

/**
 * Long names make the mark look like an afterthought in a horizontal lockup: the row is fitted
 * to the slide, so a wide name shrinks everything and the mark ends up a small dot beside a
 * long word. Names past 8 characters get a bigger mark, up to 30% for 18+ characters.
 */
export function nameBoost(nameLength: number): number {
  return clamp(1 + (nameLength - 8) * 0.03, 1, 1.3);
}

/**
 * Mark size and gap for a horizontal lockup, in units of the name's cap height.
 * Marks are sized to a similar optical area (wide marks shorter, tall marks taller), with boosts
 * for sparse marks and long names. Wide marks never drop below 1.3 cap heights: a 3:1 monoline
 * animal at one cap height reads as a smudge.
 */
export function lockupLayout({ aspect, density, nameLength = 8 }: { aspect: number; density: number; nameLength?: number }): { markHeight: number; markWidth: number; gap: number } {
  const boost = sparseBoost(density) * nameBoost(nameLength);
  let markHeight = clamp((1.8 * boost) / Math.sqrt(aspect), 1.3, 2.8);
  let markWidth = markHeight * aspect;
  if (markWidth > 5.5) {
    markWidth = 5.5;
    markHeight = markWidth / aspect;
  }
  return { markHeight, markWidth, gap: 0.6 };
}

/**
 * How far (in em) to move text with line-height 1 so the middle of its capitals sits at the
 * middle of its line box, which is what a flex-centred mark lines up with.
 */
export function capCenterShift({ ascent, descent, cap }: { ascent: number; descent: number; cap: number }): number {
  return (descent - ascent + cap) / 2;
}

/** Scale that fits content into the available width, growing it at most to maxGrow. */
export function fitScale(contentWidth: number, availableWidth: number, maxGrow = 1): number {
  if (contentWidth <= 0) return 1;
  return Math.min(maxGrow, availableWidth / contentWidth);
}

/** Mark-over-name lockup in cap heights: the mark gets the full width, so it can be larger. */
export function stackedLayout({ aspect, density }: { aspect: number; density: number }): { markHeight: number; markWidth: number; gap: number } {
  const boost = sparseBoost(density);
  let markHeight = clamp((3.2 * boost) / Math.sqrt(aspect), 2, 4.2);
  let markWidth = markHeight * aspect;
  if (markWidth > 7) {
    markWidth = 7;
    markHeight = markWidth / aspect;
  }
  return { markHeight, markWidth, gap: 0.8 };
}

/** Scale that fits a box inside another on both axes, growing it at most to maxGrow. */
export function fitBoxScale(content: { width: number; height: number }, available: { width: number; height: number }, maxGrow = 1): number {
  return Math.min(fitScale(content.width, available.width, maxGrow), fitScale(content.height, available.height, maxGrow));
}

export type LockupLayout = 'mark' | 'horizontal' | 'stacked';
const LAYOUT_CYCLE: LockupLayout[] = ['mark', 'horizontal', 'stacked'];

/**
 * Starting layouts for a direction's two lockup slides. A long name beside the mark shrinks the
 * whole row, so names past 14 characters start stacked instead of horizontal.
 */
export function defaultLockupLayouts(name: string): [LockupLayout, LockupLayout] {
  return ['mark', name.trim().length > 14 ? 'stacked' : 'horizontal'];
}

export function nextLockupLayout(current: LockupLayout): LockupLayout {
  return LAYOUT_CYCLE[(LAYOUT_CYCLE.indexOf(current) + 1) % LAYOUT_CYCLE.length];
}

/** Empty space (em) between the top of a 1em line box and the top of its capitals. */
export function capTopInset({ ascent, descent, cap }: { ascent: number; descent: number; cap: number }): number {
  return (1 - ascent - descent) / 2 + ascent - cap;
}
