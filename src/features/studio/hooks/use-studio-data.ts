'use client';

import { useMemo } from 'react';
import { collection, doc, orderBy, query } from 'firebase/firestore';
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Brand } from '@/lib/types';
import type { StudioDirection, StudioRound } from '../types';

export function useStudioData(brandId: string) {
  const { user } = useUser();
  const db = useFirestore();
  const base = user ? `users/${user.uid}/brands/${brandId}` : null;

  const brandRef = useMemoFirebase(() => (base ? doc(db, base) : null), [db, base]);
  const roundsQ = useMemoFirebase(() => (base ? query(collection(db, `${base}/rounds`), orderBy('createdAt', 'desc')) : null), [db, base]);
  const dirsQ = useMemoFirebase(() => (base ? query(collection(db, `${base}/directions`), orderBy('createdAt', 'asc')) : null), [db, base]);

  const { data: brand, isLoading: l1 } = useDoc<Brand & { styleTags?: string[] }>(brandRef);
  const { data: rounds, isLoading: l2 } = useCollection<StudioRound>(roundsQ);
  const { data: directions, isLoading: l3 } = useCollection<StudioDirection>(dirsQ);

  const grouped = useMemo(
    () => (rounds ?? []).map(round => ({
      round,
      directions: (directions ?? []).filter(d => d.roundId === round.id).sort((a, b) => a.order - b.order),
    })),
    [rounds, directions]
  );

  return { brand: brand ?? null, rounds: grouped, isLoading: l1 || l2 || l3 };
}
