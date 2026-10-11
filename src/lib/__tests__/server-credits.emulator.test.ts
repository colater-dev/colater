import { describe, it, expect, beforeAll } from 'vitest';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { createServerCredits, InsufficientCreditsError } from '../server-credits';
import { INITIAL_CREDITS } from '../credits';

const ON = !!process.env.FIRESTORE_EMULATOR_HOST;

describe.skipIf(!ON)('server credits (emulator)', () => {
  let db: Firestore;
  const uid = () => `test_${Math.random().toString(36).slice(2)}`;

  beforeAll(() => {
    const app = getApps().find(a => a.name === 'credits-test') ??
      initializeApp({ projectId: 'studio-6830756272-ca1a2' }, 'credits-test');
    db = getFirestore(app);
  });

  it('creates a profile with welcome credits once', async () => {
    const c = createServerCredits(db); const u = uid();
    expect(await c.ensureProfile(u)).toBe(INITIAL_CREDITS);
    expect(await c.ensureProfile(u)).toBe(INITIAL_CREDITS);
    const ledger = await db.collection(`userProfiles/${u}/transactions`).get();
    expect(ledger.size).toBe(1);
  });

  it('charges once per key, even when called twice', async () => {
    const c = createServerCredits(db); const u = uid();
    const first = await c.charge({ uid: u, amount: 15, action: 'studioRound', key: 'round_a' });
    const second = await c.charge({ uid: u, amount: 15, action: 'studioRound', key: 'round_a' });
    expect(first).toEqual({ balance: INITIAL_CREDITS - 15, alreadyCharged: false });
    expect(second).toEqual({ balance: INITIAL_CREDITS - 15, alreadyCharged: true });
  });

  it('refuses when the balance is too low and writes nothing', async () => {
    const c = createServerCredits(db); const u = uid();
    await c.ensureProfile(u);
    await db.doc(`userProfiles/${u}`).update({ balance: 14 });
    await expect(c.charge({ uid: u, amount: 15, action: 'studioRound', key: 'k' })).rejects.toBeInstanceOf(InsufficientCreditsError);
    expect((await db.doc(`userProfiles/${u}/charges/k`).get()).exists).toBe(false);
    expect((await db.doc(`userProfiles/${u}`).get()).data()?.balance).toBe(14);
  });

  it('refunds partially, never more than was charged', async () => {
    const c = createServerCredits(db); const u = uid();
    await c.charge({ uid: u, amount: 15, action: 'studioRound', key: 'r' });
    expect((await c.refund({ uid: u, key: 'r', amount: 5, reason: 'direction failed' })).refunded).toBe(5);
    expect((await c.refund({ uid: u, key: 'r', amount: 20, reason: 'x' })).refunded).toBe(10);
    expect((await c.refund({ uid: u, key: 'r', amount: 5, reason: 'x' })).refunded).toBe(0);
    expect((await db.doc(`userProfiles/${u}`).get()).data()?.balance).toBe(INITIAL_CREDITS);
  });
});
