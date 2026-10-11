'use client';

import { useId, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { nextRevealDelay } from '../reveal-stagger';
import { SlideShimmer } from './slide-shimmer';

/** Drops a finished slide into its slot; slides finishing together drop one after another. */
function FallIn({ children }: { children: ReactNode }) {
  const id = useId();
  const [delay] = useState(() => nextRevealDelay(id));
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="absolute inset-0 bg-white"
      initial={reduce ? { opacity: 0 } : { y: '-110%' }}
      animate={reduce ? { opacity: 1 } : { y: 0 }}
      transition={reduce ? { duration: 0.2, delay: delay / 1000 } : { type: 'spring', stiffness: 320, damping: 24, mass: 0.9, delay: delay / 1000 }}
    >
      {children}
    </motion.div>
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
        {status === 'loading' ? <SlideShimmer /> : <FallIn>{children}</FallIn>}
        {status === 'ready' && overlay}
      </div>
      {caption && status === 'ready' && <figcaption className="text-xs text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}
