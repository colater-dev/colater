'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useRequireAuth } from '@/features/auth/hooks';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useStudioData } from '@/features/studio/hooks/use-studio-data';
import { RoundBlock } from '@/features/studio/components/round-block';
import { useSlideRequest } from '@/features/studio/hooks/use-slide-request';
import { ROUND_FEEDBACK_CHIPS } from '@/features/studio/types';
import { startRound, pickDirection, sweepStudio } from '@/app/studio/actions';
import { studioRoundCost } from '@/lib/credits';
import { cn } from '@/lib/utils';

export function StudioClient({ brandId }: { brandId: string }) {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { brand, rounds, isLoading } = useStudioData(brandId);
  const { toast } = useToast();
  const [chips, setChips] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [creditError, setCreditError] = useState<string | null>(null);
  const roundIdRef = useRef<string | null>(null);
  const slides = useSlideRequest(brandId);

  useEffect(() => {
    if (user) user.getIdToken().then(token => sweepStudio(token, brandId)).catch(console.error);
  }, [user, brandId]);

  const newRound = async (seedDirectionId?: string) => {
    if (!user || isStarting) return;
    setIsStarting(true);
    setCreditError(null);
    roundIdRef.current ??= crypto.randomUUID().replace(/-/g, '');
    const res = await startRound(await user.getIdToken(), brandId, roundIdRef.current, { feedbackChips: chips, seedDirectionId, count: 1 });
    roundIdRef.current = null;
    if (res.insufficient) setCreditError(res.error ?? 'Not enough credits');
    else if (!res.success) toast({ variant: 'destructive', title: 'Could not start a new round', description: res.error });
    else setChips([]);
    setIsStarting(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pick = async (directionId: string) => {
    if (!user) return;
    const res = await pickDirection(await user.getIdToken(), brandId, directionId);
    if (!res.success) toast({ variant: 'destructive', title: 'Could not pick', description: res.error });
  };

  if (authLoading || isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!brand) return <p className="pt-24 text-center text-muted-foreground">Brand not found</p>;

  return (
    <main className="mx-auto max-w-[1400px] space-y-10 px-6 pb-24 pt-24">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{brand.latestName}</h1>
          <p className="text-sm text-muted-foreground">{brand.latestElevatorPitch}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ROUND_FEEDBACK_CHIPS.map(c => (
            <button
              key={c}
              type="button"
              aria-pressed={chips.includes(c)}
              onClick={() => setChips(cs => (cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c]))}
              className={cn('rounded-full border px-3 py-1 text-xs', chips.includes(c) ? 'border-foreground bg-foreground text-background' : 'hover:border-foreground/40')}
            >
              {c}
            </button>
          ))}
          <Button onClick={() => newRound()} disabled={isStarting}>
            {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : `New direction · ${studioRoundCost(1)}`}
          </Button>
        </div>
      </header>
      {(creditError ?? slides.creditError) && (
        <p className="text-sm text-muted-foreground">{creditError ?? slides.creditError} <Link href="/credits" className="underline">Get credits</Link></p>
      )}
      {rounds.length === 0 && <p className="text-muted-foreground">No directions yet. Press “New direction” to start.</p>}
      {rounds.map(({ round, directions }) => (
        <RoundBlock
          key={round.id}
          directions={directions}
          brandName={brand.latestName}
          onPick={pick}
          onVariations={id => newRound(id)}
          onGenerate={slides.request}
          isBusy={(id, kind) => !!slides.busy[`${id}:${kind}`]}
        />
      ))}
    </main>
  );
}
