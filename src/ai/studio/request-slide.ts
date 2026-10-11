import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { ServerCredits } from '@/lib/server-credits';
import type { CreditAction } from '@/lib/credits';
import { GENERATE_COSTS, type GenerateKind } from '@/features/studio/types';

const ACTIONS: Record<GenerateKind, CreditAction | null> = {
  color: 'studioColor', voice: 'studioVoice', vector: 'studioVector', mark: 'studioMarkRedo', lockup: null,
};

export async function requestSlide(
  db: Firestore,
  credits: ServerCredits,
  a: { uid: string; brandId: string; directionId: string; kind: GenerateKind; clientRequestId: string; feedback?: { chips: string[]; note?: string } }
): Promise<{ status: 'scheduled' | 'duplicate'; chargeKey: string | null; cost: number }> {
  const ref = db.doc(`users/${a.uid}/brands/${a.brandId}/directions/${a.directionId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Direction not found');
  if (a.kind !== 'mark' && !snap.data()?.markUrl) throw new Error('Direction not ready');

  const cost = GENERATE_COSTS[a.kind];
  const action = ACTIONS[a.kind];
  const chargeKey = action ? `slide_${a.directionId}_${a.clientRequestId}` : null;
  if (action && chargeKey) {
    const { alreadyCharged } = await credits.charge({ uid: a.uid, amount: cost, action, key: chargeKey });
    if (alreadyCharged) return { status: 'duplicate', chargeKey, cost };
  }

  const pending =
    a.kind === 'mark' ? { status: 'generating', stage: 'concept', redoChargeKey: chargeKey, redoCost: cost, redoRequestedAt: FieldValue.serverTimestamp() }
    : a.kind === 'lockup' ? {}
    : { [`slides.${a.kind}`]: { status: 'pending', chargeKey, cost, requestedAt: FieldValue.serverTimestamp() } };
  const feedbackEntry = a.feedback && (a.feedback.chips.length || a.feedback.note)
    ? { feedback: FieldValue.arrayUnion({ slideKind: a.kind, chips: a.feedback.chips, note: a.feedback.note ?? null, at: new Date().toISOString() }) }
    : {};
  await ref.update({ ...pending, ...feedbackEntry, updatedAt: FieldValue.serverTimestamp() });
  await db.collection('events').add({
    type: a.feedback ? 'slide_feedback' : 'slide_generated', uid: a.uid, brandId: a.brandId, directionId: a.directionId,
    kind: a.kind, chips: a.feedback?.chips ?? [], recipe: snap.data()?.recipe ?? null, createdAt: FieldValue.serverTimestamp(),
  });
  return { status: 'scheduled', chargeKey, cost };
}
