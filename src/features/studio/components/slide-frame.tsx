import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function SlideFrame({ caption, status, children, className }: {
  caption?: string;
  status: 'loading' | 'ready' | 'failed';
  children?: ReactNode;
  className?: string;
}) {
  return (
    <figure className="w-[320px] shrink-0 space-y-2">
      <div
        style={{ containerType: 'inline-size' }}
        className={cn(
          'relative aspect-video overflow-hidden rounded-xl border bg-white',
          status === 'loading' && 'animate-pulse bg-muted',
          className
        )}
      >
        {status !== 'loading' && children}
      </div>
      {caption && status === 'ready' && <figcaption className="text-xs text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}
