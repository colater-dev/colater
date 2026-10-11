import { FieldValue, type Firestore, type Timestamp } from 'firebase-admin/firestore';
import type { ServerCredits } from '@/lib/server-credits';
import { STUDIO_DIRECTION_REFUND } from '@/lib/credits';

/**
 * Background work (Next `after()`) can be killed by the host mid-pipeline. Every step has its own
 * timeout (Claude 45s, fal 60s, download 30s), so anything still unfinished after this long is dead.
 */
export const STALE_DIRECTION_MS = 10 * 60 * 1000;

/** Marks stuck directions failed and refunds their share. Returns how many were swept. */
export async function sweepStaleDirections(
  db: Firestore,
  credits: ServerCredits,
  { uid, brandId, now = Date.now() }: { uid: string; brandId: string; now?: number }
): Promise<number> {
  const dirs = db.collection(`users/${uid}/brands/${brandId}/directions`);
  const unfinished = await dirs.where('status', 'in', ['pending', 'generating']).get();
  let swept = 0;
  for (const d of unfinished.docs) {
    const createdAt = d.data().createdAt as Timestamp | undefined;
    if (!createdAt || now - createdAt.toMillis() < STALE_DIRECTION_MS) continue;
    const claimed = await db.runTransaction(async tx => {
      const snap = await tx.get(d.ref);
      if (!['pending', 'generating'].includes(snap.data()?.status)) return false;
      tx.update(d.ref, { status: 'failed', error: 'Timed out', updatedAt: FieldValue.serverTimestamp() });
      return true;
    });
    if (!claimed) continue;
    swept++;
    const chargeKey = d.data().chargeKey as string | undefined;
    if (chargeKey) await credits.refund({ uid, key: chargeKey, amount: STUDIO_DIRECTION_REFUND, reason: 'direction timed out' });
  }
  return swept;
}
