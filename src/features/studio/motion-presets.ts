import type { MotionProps, Transition } from 'framer-motion';

interface Anim {
  initial: Exclude<MotionProps['initial'], boolean | string | string[] | undefined>;
  animate: Exclude<MotionProps['animate'], boolean | string | string[] | undefined>;
  transition: Transition;
}

export interface MotionPreset {
  id: string;
  label: string;
  /** Roughly when the reveal settles, before letter staggering; the loop waits this long plus a pause. */
  durationMs: number;
  mark: Anim;
  name: Anim;
  /** When set, the name animates letter by letter with this stagger (seconds). */
  letterStagger?: number;
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Logo reveals for the motion slide. Each direction gets one; clicking plays another. */
export const MOTION_PRESETS: MotionPreset[] = [
  {
    id: 'iris', label: 'Iris', durationMs: 1400,
    mark: { initial: { clipPath: 'circle(0% at 50% 50%)', scale: 0.85, opacity: 0 }, animate: { clipPath: 'circle(75% at 50% 50%)', scale: 1, opacity: 1 }, transition: { duration: 1, ease: EASE_OUT } },
    name: { initial: { x: '-0.6em', opacity: 0 }, animate: { x: 0, opacity: 1 }, transition: { duration: 0.8, delay: 0.6, ease: EASE_OUT } },
  },
  {
    id: 'rise', label: 'Rise', durationMs: 1200,
    mark: { initial: { y: '40%', opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { type: 'spring', stiffness: 220, damping: 20 } },
    name: { initial: { y: '0.6em', opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.5, delay: 0.35, ease: EASE_OUT } },
    letterStagger: 0.04,
  },
  {
    id: 'spin', label: 'Spin', durationMs: 1500,
    mark: { initial: { rotate: -120, scale: 0.4, opacity: 0 }, animate: { rotate: 0, scale: 1, opacity: 1 }, transition: { type: 'spring', stiffness: 160, damping: 16 } },
    name: { initial: { letterSpacing: '0.5em', opacity: 0 }, animate: { letterSpacing: '0em', opacity: 1 }, transition: { duration: 0.9, delay: 0.5, ease: EASE_OUT } },
  },
  {
    id: 'wipe', label: 'Wipe', durationMs: 1300,
    mark: { initial: { clipPath: 'inset(0 100% 0 0)' }, animate: { clipPath: 'inset(0 0% 0 0)' }, transition: { duration: 0.7, ease: [0.65, 0, 0.35, 1] } },
    name: { initial: { clipPath: 'inset(0 100% 0 0)' }, animate: { clipPath: 'inset(0 0% 0 0)' }, transition: { duration: 0.7, delay: 0.5, ease: [0.65, 0, 0.35, 1] } },
  },
  {
    id: 'pop', label: 'Pop', durationMs: 1100,
    mark: { initial: { scale: 0 }, animate: { scale: 1 }, transition: { type: 'spring', stiffness: 420, damping: 12 } },
    name: { initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: 'spring', stiffness: 500, damping: 18, delay: 0.3 } },
    letterStagger: 0.05,
  },
  {
    id: 'focus', label: 'Focus', durationMs: 1400,
    mark: { initial: { filter: 'blur(16px)', scale: 1.15, opacity: 0 }, animate: { filter: 'blur(0px)', scale: 1, opacity: 1 }, transition: { duration: 1, ease: EASE_OUT } },
    name: { initial: { filter: 'blur(12px)', opacity: 0 }, animate: { filter: 'blur(0px)', opacity: 1 }, transition: { duration: 0.9, delay: 0.4, ease: EASE_OUT } },
  },
  {
    id: 'drop', label: 'Drop', durationMs: 1400,
    mark: { initial: { y: '-160%' }, animate: { y: 0 }, transition: { type: 'spring', stiffness: 260, damping: 11 } },
    name: { initial: { y: '0.4em', opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.5, delay: 0.6, ease: EASE_OUT } },
  },
  {
    id: 'type', label: 'Type', durationMs: 900,
    mark: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5 } },
    name: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.01, delay: 0.5 } },
    letterStagger: 0.08,
  },
];

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

/** The preset a direction starts with: random across directions, stable across reloads. */
export function pickMotionPreset(seed: string): MotionPreset {
  return MOTION_PRESETS[hash(seed) % MOTION_PRESETS.length];
}

/** A different preset, chosen at random. */
export function nextMotionPreset(currentId: string, random: () => number = Math.random): MotionPreset {
  const others = MOTION_PRESETS.filter(p => p.id !== currentId);
  return others[Math.floor(random() * others.length)];
}
