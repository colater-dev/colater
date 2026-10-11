/**
 * Hands out reveal delays so slides that become ready together fall in one after another.
 * A slide that turns ready on its own (after a quiet gap) falls immediately.
 */
export function createRevealStagger({ step = 90, gap = 250, max = 900, now = () => Date.now() } = {}) {
  const assigned = new Map<string, { delay: number; at: number }>();
  let lastAt = -Infinity;
  let count = 0;
  return (key: string): number => {
    const t = now();
    const prev = assigned.get(key);
    if (prev && t - prev.at < 1000) return prev.delay; // StrictMode re-runs ask twice
    if (t - lastAt > gap) count = 0;
    const delay = Math.min(count * step, max);
    count++;
    lastAt = t;
    assigned.set(key, { delay, at: t });
    return delay;
  };
}

export const nextRevealDelay = createRevealStagger();
