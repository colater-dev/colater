'use client';

import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SlidePlaceholder({ label, cost, state, onGenerate }: {
  label: string;
  cost: number;
  state: 'idle' | 'pending' | 'failed';
  onGenerate: () => void;
}) {
  return (
    <figure className="w-[320px] shrink-0 space-y-2">
      <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed text-sm text-muted-foreground">
        {state === 'pending' ? (
          <><Loader2 className="h-5 w-5 animate-spin" /><span>Making {label.toLowerCase()}…</span></>
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
