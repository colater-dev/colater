'use client';

import { useId, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { nextRevealDelay } from '../reveal-stagger';
import { SlideShimmer } from './slide-shimmer';

/**
 * A finished slide is pushed out like a polaroid from a camera: it emerges downward from a slot
 * along the top edge at a steady motor speed, with a small hitch and a settle at the end.
 * Slides finishing together come out in turn.
 */
function Eject({ children }: { children: ReactNode }) {
  const id = useId();
  const [delay] = useState(() => nextRevealDelay(id) / 1000);
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <motion.div className="absolute inset-0 bg-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay }}>
        {children}
      </motion.div>
    );
  }
  return (
    <div className="absolute inset-0 bg-neutral-100">
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ y: '-100%' }}
        animate={{ y: ['-100%', '-48%', '-45%', '1.5%', '0%'] }}
        transition={{ duration: 1.25, times: [0, 0.42, 0.52, 0.9, 1], ease: ['linear', 'easeInOut', 'linear', 'easeOut'], delay }}
      >
        {children}
      </motion.div>
      {/* The slot's shadow, there while the print is coming out. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[6%] bg-gradient-to-b from-black/25 to-transparent"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.4, delay: delay + 1.1 }}
      />
    </div>
  );
}

export function SlideFrame({ caption, status, children, className, overlay }: {
  caption?: string;
  status: 'loading' | 'ready' | 'failed';
  children?: ReactNode;
  className?: string;
  overlay?: ReactNode;
}) {
  return (
    <figure className="group w-[320px] shrink-0 space-y-2">
      <div style={{ containerType: 'inline-size' }} className={cn('relative aspect-video overflow-hidden rounded-xl border bg-white', className)}>
        {status === 'loading' ? <SlideShimmer /> : <Eject>{children}</Eject>}
        {status === 'ready' && overlay}
      </div>
      {caption && status === 'ready' && <figcaption className="text-xs text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}
