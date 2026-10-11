import { describe, it, expect, beforeAll } from 'vitest';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { toggleFavorite } from '../toggle-favorite';

const ON = !!process.env.FIRESTORE_EMULATOR_HOST;

describe.skipIf(!ON)('toggleFavorite (emulator)', () => {
  let db: Firestore;
  beforeAll(() => {
    const app = getApps().find(a => a.name === 'fav-test') ?? initializeApp({ projectId: 'studio-6830756272-ca1a2' }, 'fav-test');
    db = getFirestore(app);
  });

  it('flips the heart on and off and logs each change', async () => {
    const uid = `t_${Math.random().toString(36).slice(2)}`;
    const ref = db.doc(`users/${uid}/brands/b/directions/d`);
    await ref.set({ status: 'ready', recipe: { ideaType: 'lettermark', styleLean: 'calm', model: 'recraft' } });
    expect(await toggleFavorite(db, { uid, brandId: 'b', directionId: 'd' })).toBe(true);
    expect((await ref.get()).data()?.favorite).toBe(true);
    expect(await toggleFavorite(db, { uid, brandId: 'b', directionId: 'd' })).toBe(false);
    expect((await ref.get()).data()?.favorite).toBe(false);
    const events = await db.collection('events').where('uid', '==', uid).get();
    expect(events.docs.map(e => e.data().type).sort()).toEqual(['favorited', 'unfavorited']);
  });

  it('rejects a missing direction', async () => {
    await expect(toggleFavorite(db, { uid: 'nobody_x', brandId: 'b', directionId: 'missing' })).rejects.toThrow('Direction not found');
  });
});
