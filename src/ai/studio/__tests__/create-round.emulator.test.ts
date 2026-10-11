import { describe, it, expect, beforeAll } from 'vitest';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { createServerCredits } from '@/lib/server-credits';
import { INITIAL_CREDITS } from '@/lib/credits';
import { createRound } from '../create-round';
import type { Recipe } from '../recipes';

const ON = !!process.env.FIRESTORE_EMULATOR_HOST;
const recipes: Recipe[] = [
  { ideaType: 'lettermark', styleLean: 'bold', model: 'recraft' },
  { ideaType: 'negative-space', styleLean: 'bold', model: 'gpt-image' },
  { ideaType: 'literal-symbol', styleLean: 'bold', model: 'nano-banana' },
];

describe.skipIf(!ON)('createRound (emulator)', () => {
  let db: Firestore;
  beforeAll(() => {
    const app = getApps().find(a => a.name === 'create-round-test') ?? initializeApp({ projectId: 'studio-6830756272-ca1a2' }, 'create-round-test');
    db = getFirestore(app);
  });

  it('two concurrent requests with the same round id create one round, charge once, and both succeed', async () => {
    const uid = `t_${Math.random().toString(36).slice(2)}`;
    const credits = createServerCredits(db);
    const args = { uid, brandId: 'brand_abc', clientRoundId: 'round_same_1', recipes, feedbackChips: [], seedDirectionId: null, cost: 15 };
    const results = await Promise.all([createRound(db, credits, args), createRound(db, credits, args)]);
    expect(results.map(r => r.status).sort()).toEqual(['created', 'exists']);
    const base = `users/${uid}/brands/brand_abc`;
    expect((await db.collection(`${base}/rounds`).get()).size).toBe(1);
    expect((await db.collection(`${base}/directions`).get()).size).toBe(3);
    expect((await db.doc(`userProfiles/${uid}`).get()).data()?.balance).toBe(INITIAL_CREDITS - 15);
  });

  it('stores the charge key on each direction so failures can be refunded later', async () => {
    const uid = `t_${Math.random().toString(36).slice(2)}`;
    const r = await createRound(db, createServerCredits(db), { uid, brandId: 'brand_abc', clientRoundId: 'round_key_1', recipes, feedbackChips: [], seedDirectionId: null, cost: 15 });
    expect(r.status).toBe('created');
    const dirs = await db.collection(`users/${uid}/brands/brand_abc/directions`).get();
    for (const d of dirs.docs) expect(d.data().chargeKey).toBe('round_brand_abc_round_key_1');
  });
});
