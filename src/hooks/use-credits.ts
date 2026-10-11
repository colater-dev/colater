'use client';

import { useMemo, useEffect, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { createCreditsService } from '@/services/credits.service';
import type { UserCredits } from '@/lib/credits';
import { ensureCreditProfile } from '@/app/actions/credits';

/**
 * Hook that provides the current user's credit balance in real-time.
 * Initializes credits for new users automatically.
 */
export function useCredits() {
  const { user } = useUser();
  const firestore = useFirestore();

  const creditsService = useMemo(
    () => createCreditsService(firestore),
    [firestore]
  );

  const profileRef = useMemoFirebase(
    () => (user ? creditsService.getProfileDoc(user.uid) : null),
    [user, creditsService]
  );

  const { data: profile, isLoading } = useDoc<UserCredits>(profileRef);

  // Auto-initialize credits for new users (server-side; clients can't write balances)
  const initRequested = useRef(false);
  useEffect(() => {
    if (user && !isLoading && !profile && !initRequested.current) {
      initRequested.current = true;
      user.getIdToken().then(ensureCreditProfile).catch(console.error);
    }
  }, [user, isLoading, profile]);

  return {
    balance: profile?.balance ?? 0,
    isLoading,
    creditsService,
  };
}
