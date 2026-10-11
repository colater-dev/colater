'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Logo } from '@/lib/types';

/**
 * Every legacy logo the user has, newest first, kept live. Reads each brand's `logoGenerations`
 * separately: the security rules allow those reads, while a collection-group query is denied.
 */
export function useUserLogos(uid: string | undefined): { logos: Logo[]; isLoading: boolean } {
  const firestore = useFirestore();
  const brandsQuery = useMemoFirebase(() => (uid ? collection(firestore, `users/${uid}/brands`) : null), [uid, firestore]);
  const { data: brands, isLoading: brandsLoading } = useCollection<{ id: string }>(brandsQuery);
  const brandIds = useMemo(() => (brands ?? []).map(b => b.id).sort().join(','), [brands]);
  const [byBrand, setByBrand] = useState<Record<string, Logo[]>>({});

  useEffect(() => {
    if (!uid || !brandIds) return;
    const unsubscribes = brandIds.split(',').map(brandId =>
      onSnapshot(
        query(collection(firestore, `users/${uid}/brands/${brandId}/logoGenerations`), orderBy('createdAt', 'desc')),
        snap => setByBrand(prev => ({ ...prev, [brandId]: snap.docs.map(d => ({ brandId, ...d.data(), id: d.id }) as Logo) })),
        error => {
          console.error(`[ranker] could not load logos for brand ${brandId}:`, error);
          setByBrand(prev => ({ ...prev, [brandId]: [] }));
        }
      )
    );
    return () => unsubscribes.forEach(u => u());
  }, [uid, brandIds, firestore]);

  const ids = brandIds ? brandIds.split(',') : [];
  const logos = useMemo(
    () => ids.flatMap(id => byBrand[id] ?? []).sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [byBrand, brandIds]
  );
  return { logos, isLoading: brandsLoading || ids.some(id => !(id in byBrand)) };
}
