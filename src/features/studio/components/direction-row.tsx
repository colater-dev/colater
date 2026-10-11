'use client';

import { Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SlideFrame } from './slide-frame';
import { MarkSlide } from './slides/mark-slide';
import { LockupSlide } from './slides/lockup-slide';
import { InUseSlide } from './slides/in-use-slide';
import { TypographySlide } from './slides/typography-slide';
import type { StudioDirection } from '../types';

export function DirectionRow({ direction, brandName, collapsed, onPick, onVariations }: {
  direction: StudioDirection;
  brandName: string;
  collapsed: boolean;
  onPick: () => void;
  onVariations: () => void;
}) {
  const { status, concept, markUrl, fontName, picked } = direction;
  const ready = status === 'ready' && !!markUrl;
  const frame = status === 'failed' ? 'failed' : ready ? 'ready' : 'loading';

  if (status === 'failed') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4" /> This direction couldn&apos;t be generated; its credits were refunded.
      </div>
    );
  }

  return (
    <section className={cn('space-y-3 transition-opacity', collapsed && 'opacity-50 hover:opacity-100')}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm">{concept?.idea ?? 'Thinking…'}</p>
        {ready && (
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="ghost" onClick={onVariations}>More like this</Button>
            <Button size="sm" variant={picked ? 'default' : 'outline'} onClick={onPick}>
              {picked ? <><Check className="mr-1 h-3 w-3" />Picked</> : 'Pick this'}
            </Button>
          </div>
        )}
      </div>
      <div className={cn('flex gap-4 overflow-x-auto pb-2', collapsed && 'max-h-24 overflow-hidden')}>
        <SlideFrame status={frame} caption={concept?.captions.mark}>{markUrl && <MarkSlide markUrl={markUrl} />}</SlideFrame>
        <SlideFrame status={frame} caption={concept?.captions.lockup}>{markUrl && <LockupSlide markUrl={markUrl} name={brandName} fontName={fontName} />}</SlideFrame>
        <SlideFrame status={frame} caption={concept?.captions.inUse}>{markUrl && <InUseSlide markUrl={markUrl} />}</SlideFrame>
        <SlideFrame status={frame} caption="Typography">{markUrl && <TypographySlide name={brandName} fontName={fontName} />}</SlideFrame>
      </div>
    </section>
  );
}
