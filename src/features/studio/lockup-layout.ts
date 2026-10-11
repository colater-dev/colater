const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Mark size and gap for a horizontal lockup, in units of the name's cap height.
 * Marks are sized to a similar optical area (wide marks shorter, tall marks taller),
 * and sparse line marks get a small boost so they don't look weaker than solid ones.
 */
export function lockupLayout({ aspect, density }: { aspect: number; density: number }): { markHeight: number; markWidth: number; gap: number } {
  const boost = clamp(1 + (0.45 - density) * 0.5, 1, 1.15);
  let markHeight = clamp((1.8 * boost) / Math.sqrt(aspect), 1.1, 2.4);
  let markWidth = markHeight * aspect;
  if (markWidth > 4.5) {
    markWidth = 4.5;
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
  const boost = clamp(1 + (0.45 - density) * 0.5, 1, 1.15);
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

export function nextLockupLayout(current: LockupLayout): LockupLayout {
  return LAYOUT_CYCLE[(LAYOUT_CYCLE.indexOf(current) + 1) % LAYOUT_CYCLE.length];
}

/** Empty space (em) between the top of a 1em line box and the top of its capitals. */
export function capTopInset({ ascent, descent, cap }: { ascent: number; descent: number; cap: number }): number {
  return (1 - ascent - descent) / 2 + ascent - cap;
}
