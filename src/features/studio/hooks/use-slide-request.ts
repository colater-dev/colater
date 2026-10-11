'use client';

import { useCallback, useRef, useState } from 'react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { generateSlide } from '@/app/studio/actions';
import type { GenerateKind } from '../types';

export function useSlideRequest(brandId: string) {
  const { user } = useUser();
  const { toast } = useToast();
  const ids = useRef<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [creditError, setCreditError] = useState<string | null>(null);

  const request = useCallback(async (directionId: string, kind: GenerateKind, feedback?: { chips: string[]; note?: string }) => {
    const slot = `${directionId}:${kind}`;
    if (!user || busy[slot]) return;
    setBusy(b => ({ ...b, [slot]: true }));
    setCreditError(null);
    ids.current[slot] ??= crypto.randomUUID().replace(/-/g, '');
    try {
      const res = await generateSlide(await user.getIdToken(), brandId, directionId, kind, ids.current[slot], feedback);
      if (res.insufficient) setCreditError(res.error ?? 'Not enough credits');
      else if (!res.success) toast({ variant: 'destructive', title: 'Could not generate', description: res.error });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Could not generate', description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      delete ids.current[slot];
      setBusy(b => ({ ...b, [slot]: false }));
    }
  }, [user, brandId, busy, toast]);

  return { request, busy, creditError };
}
