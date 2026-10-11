import { cn } from '@/lib/utils';

/** A bright band sweeping across a grey slot; used wherever a slide is still being made. */
export function SlideShimmer({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('absolute inset-0 overflow-hidden bg-neutral-200', className)}>
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/80 to-transparent motion-reduce:animate-none" />
    </div>
  );
}
