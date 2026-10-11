import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function SlideFrame({ caption, status, children, className, overlay, style }: {
  caption?: string;
  status: 'loading' | 'ready' | 'failed';
  children?: ReactNode;
  className?: string;
  overlay?: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <figure className="group w-[320px] shrink-0 space-y-2">
      <div
        style={{ containerType: 'inline-size', ...style }}
        className={cn(
          'relative aspect-video overflow-hidden rounded-xl border bg-white',
          status === 'loading' && 'animate-pulse bg-muted',
          className
        )}
      >
        {status !== 'loading' && children}
        {status === 'ready' && overlay}
      </div>
      {caption && status === 'ready' && <figcaption className="text-xs text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}
