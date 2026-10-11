import { describe, it, expect, beforeAll } from 'vitest';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { createServerCredits } from '@/lib/server-credits';
import { INITIAL_CREDITS } from '@/lib/credits';
import { sweepStaleDirections, STALE_DIRECTION_MS } from '../sweep-stale';

const ON = !!process.env.FIRESTORE_EMULATOR_HOST;

describe.skipIf(!ON)('sweepStaleDirections (emulator)', () => {
  let db: Firestore;
  beforeAll(() => {
    const app = getApps().find(a => a.name === 'sweep-test') ?? initializeApp({ projectId: 'studio-6830756272-ca1a2' }, 'sweep-test');
    db = getFirestore(app);
  });

  it('fails and refunds directions stuck past the timeout, leaving fresh and finished ones alone', async () => {
    const uid = `t_${Math.random().toString(36).slice(2)}`;
    const credits = createServerCredits(db);
    await credits.charge({ uid, amount: 15, action: 'studioRound', key: 'round_k' });
    const base = `users/${uid}/brands/b/directions`;
    const now = Date.now();
    const old = Timestamp.fromMillis(now - STALE_DIRECTION_MS - 60_000);
    const fresh = Timestamp.fromMillis(now - 30_000);
    await db.doc(`${base}/stuck1`).set({ status: 'generating', chargeKey: 'round_k', createdAt: old });
    await db.doc(`${base}/stuck2`).set({ status: 'pending', chargeKey: 'round_k', createdAt: old });
    await db.doc(`${base}/fresh`).set({ status: 'generating', chargeKey: 'round_k', createdAt: fresh });
    await db.doc(`${base}/done`).set({ status: 'ready', chargeKey: 'round_k', createdAt: old });

    expect(await sweepStaleDirections(db, credits, { uid, brandId: 'b', now })).toBe(2);

    expect((await db.doc(`${base}/stuck1`).get()).data()?.status).toBe('failed');
    expect((await db.doc(`${base}/stuck2`).get()).data()?.status).toBe('failed');
    expect((await db.doc(`${base}/fresh`).get()).data()?.status).toBe('generating');
    expect((await db.doc(`${base}/done`).get()).data()?.status).toBe('ready');
    expect((await db.doc(`userProfiles/${uid}`).get()).data()?.balance).toBe(INITIAL_CREDITS - 5);
  });
});
