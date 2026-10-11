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
    const data = d.data();
    const startedAt = (data.redoRequestedAt ?? data.createdAt) as Timestamp | undefined;
    if (!startedAt || now - startedAt.toMillis() < STALE_DIRECTION_MS) continue;
    const claimed = await db.runTransaction(async tx => {
      const snap = await tx.get(d.ref);
      if (!['pending', 'generating'].includes(snap.data()?.status)) return false;
      tx.update(d.ref, { status: 'failed', error: 'Timed out', updatedAt: FieldValue.serverTimestamp() });
      return true;
    });
    if (!claimed) continue;
    swept++;
    const key = (data.redoChargeKey ?? data.chargeKey) as string | undefined;
    const amount = (data.redoCost ?? STUDIO_DIRECTION_REFUND) as number;
    if (key) await credits.refund({ uid, key, amount, reason: 'direction timed out' });
  }

  const ready = await dirs.where('status', '==', 'ready').get();
  for (const d of ready.docs) {
    const slides = (d.data().slides ?? {}) as Record<string, { status?: string; requestedAt?: Timestamp; chargeKey?: string; cost?: number }>;
    for (const [kind, s] of Object.entries(slides)) {
      if (s?.status !== 'pending' || !s.requestedAt || now - s.requestedAt.toMillis() < STALE_DIRECTION_MS) continue;
      const claimed = await db.runTransaction(async tx => {
        const snap = await tx.get(d.ref);
        if (snap.data()?.slides?.[kind]?.status !== 'pending') return false;
        tx.update(d.ref, { [`slides.${kind}.status`]: 'failed', [`slides.${kind}.error`]: 'Timed out' });
        return true;
      });
      if (!claimed) continue;
      swept++;
      if (s.chargeKey && s.cost) await credits.refund({ uid, key: s.chargeKey, amount: s.cost, reason: `${kind} timed out` });
    }
  }
  return swept;
}
