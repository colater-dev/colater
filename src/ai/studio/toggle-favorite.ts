import { FieldValue, type Firestore } from 'firebase-admin/firestore';

/** Flips a direction's heart and logs it (a learning signal). Returns the new state. */
export async function toggleFavorite(db: Firestore, a: { uid: string; brandId: string; directionId: string }): Promise<boolean> {
  const ref = db.doc(`users/${a.uid}/brands/${a.brandId}/directions/${a.directionId}`);
  const { favorite, recipe } = await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('Direction not found');
    const next = !snap.data()?.favorite;
    tx.update(ref, { favorite: next, updatedAt: FieldValue.serverTimestamp() });
    return { favorite: next, recipe: snap.data()?.recipe ?? null };
  });
  await db.collection('events').add({
    type: favorite ? 'favorited' : 'unfavorited', uid: a.uid, brandId: a.brandId, directionId: a.directionId, recipe, createdAt: FieldValue.serverTimestamp(),
  }).catch(console.error);
  return favorite;
}
