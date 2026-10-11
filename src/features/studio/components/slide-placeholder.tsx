'use client';

import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SlideShimmer } from './slide-shimmer';

export function SlidePlaceholder({ label, cost, state, onGenerate }: {
  label: string;
  cost: number;
  state: 'idle' | 'pending' | 'failed';
  onGenerate: () => void;
}) {
  return (
    <figure className="w-[320px] shrink-0 space-y-2">
      <div className="relative flex aspect-video flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed text-sm text-muted-foreground">
        {state === 'pending' ? (
          <><SlideShimmer /><span className="relative flex items-center gap-2 text-neutral-600"><Loader2 className="h-4 w-4 animate-spin" />Making {label.toLowerCase()}…</span></>
        ) : (
          <>
            {state === 'failed' && <span className="flex items-center gap-1"><AlertCircle className="h-4 w-4" />Didn&apos;t work; credits refunded</span>}
            <span className="font-medium text-foreground">{label}</span>
            <Button size="sm" variant="outline" onClick={onGenerate}>
              {state === 'failed' ? 'Retry' : 'Generate'} · {cost === 0 ? 'free' : `${cost} credits`}
            </Button>
          </>
        )}
      </div>
    </figure>
  );
}
