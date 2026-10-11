import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { ServerCredits } from '@/lib/server-credits';
import type { Recipe } from './recipes';

export interface CreateRoundArgs {
  uid: string;
  brandId: string;
  clientRoundId: string;
  recipes: Recipe[];
  feedbackChips: string[];
  seedDirectionId: string | null;
  cost: number;
}

export type CreateRoundResult =
  | { status: 'created'; chargeKey: string; directions: { id: string; recipe: Recipe }[] }
  | { status: 'exists'; chargeKey: string };

/** Charges the round (idempotent by key) and writes the round + pending direction docs. */
export async function createRound(db: Firestore, credits: ServerCredits, a: CreateRoundArgs): Promise<CreateRoundResult> {
  const brandRef = db.doc(`users/${a.uid}/brands/${a.brandId}`);
  const roundRef = brandRef.collection('rounds').doc(a.clientRoundId);
  const chargeKey = `round_${a.brandId}_${a.clientRoundId}`;
  if ((await roundRef.get()).exists) return { status: 'exists', chargeKey };

  await credits.charge({ uid: a.uid, amount: a.cost, action: 'studioRound', key: chargeKey });

  const batch = db.batch();
  batch.create(roundRef, { createdAt: FieldValue.serverTimestamp(), feedbackChips: a.feedbackChips, seedDirectionId: a.seedDirectionId });
  const directions = a.recipes.map((recipe, order) => {
    const ref = brandRef.collection('directions').doc();
    batch.create(ref, { roundId: a.clientRoundId, order, recipe, chargeKey, status: 'pending', picked: false, createdAt: FieldValue.serverTimestamp() });
    return { id: ref.id, recipe };
  });
  try {
    await batch.commit();
  } catch (error) {
    // A concurrent request with the same round id won the race; its charge is ours (same key).
    if ((error as { code?: number }).code === 6) return { status: 'exists', chargeKey };
    await credits.refund({ uid: a.uid, key: chargeKey, amount: a.cost, reason: 'round could not be created' });
    throw error;
  }
  return { status: 'created', chargeKey, directions };
}
