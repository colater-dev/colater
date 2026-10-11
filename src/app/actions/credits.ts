'use server';

import { randomUUID } from 'node:crypto';
import { adminDb } from '@/firebase/server';
import { requireServerAuth } from '@/lib/server-auth';
import { createServerCredits, InsufficientCreditsError } from '@/lib/server-credits';
import { CREDIT_COSTS, type CreditAction } from '@/lib/credits';

export async function ensureCreditProfile(idToken: string): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const { uid } = await requireServerAuth(idToken);
    return { success: true, balance: await createServerCredits(adminDb).ensureProfile(uid) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not load credits' };
  }
}

/** Legacy pages (editor, presentation): charge a fixed action cost on the server. */
export async function spendCredits(
  idToken: string,
  action: CreditAction
): Promise<{ success: boolean; balance?: number; error?: string; insufficient?: boolean }> {
  try {
    const { uid } = await requireServerAuth(idToken);
    if (!(action in CREDIT_COSTS)) return { success: false, error: 'Unknown action' };
    const { balance } = await createServerCredits(adminDb).charge({ uid, amount: CREDIT_COSTS[action], action, key: `spend_${randomUUID()}` });
    return { success: true, balance };
  } catch (error) {
    if (error instanceof InsufficientCreditsError) return { success: false, insufficient: true, error: error.message };
    return { success: false, error: error instanceof Error ? error.message : 'Could not charge credits' };
  }
}
