import { describe, it, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection } from 'firebase/firestore';

const ON = !!process.env.FIRESTORE_EMULATOR_HOST;

describe.skipIf(!ON)('firestore rules (emulator)', () => {
  let env: RulesTestEnvironment;
  beforeAll(async () => {
    const [host, port] = process.env.FIRESTORE_EMULATOR_HOST!.split(':');
    env = await initializeTestEnvironment({
      projectId: 'demo-colater-rules',
      firestore: { rules: readFileSync('firestore.rules', 'utf8'), host, port: Number(port) },
    });
    await env.withSecurityRulesDisabled(async ctx => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'userProfiles/alice'), { balance: 50, totalUsed: 0, totalPurchased: 0 });
      await setDoc(doc(db, 'users/alice/brands/b1'), { userId: 'alice', latestName: 'X' });
      await setDoc(doc(db, 'users/alice/brands/b1/rounds/r1'), { createdAt: 1 });
      await setDoc(doc(db, 'users/alice/brands/b1/directions/d1'), { roundId: 'r1' });
    });
  });
  afterAll(async () => { await env?.cleanup(); });

  const alice = () => env.authenticatedContext('alice').firestore();
  const bob = () => env.authenticatedContext('bob').firestore();

  it('owner can read but not write credit balance or ledger', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'userProfiles/alice')));
    await assertFails(updateDoc(doc(alice(), 'userProfiles/alice'), { balance: 9999 }));
    await assertFails(setDoc(doc(alice(), 'userProfiles/alice'), { balance: 9999 }));
    await assertFails(addDoc(collection(alice(), 'userProfiles/alice/transactions'), { amount: 9999 }));
    await assertFails(getDoc(doc(alice(), 'userProfiles/alice/charges/x')));
  });

  it('owner can read rounds and directions; nobody can write them from the client', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'users/alice/brands/b1/rounds/r1')));
    await assertSucceeds(getDoc(doc(alice(), 'users/alice/brands/b1/directions/d1')));
    await assertFails(getDoc(doc(bob(), 'users/alice/brands/b1/directions/d1')));
    await assertFails(updateDoc(doc(alice(), 'users/alice/brands/b1/directions/d1'), { picked: true }));
    await assertFails(setDoc(doc(alice(), 'users/alice/brands/b1/rounds/r2'), { createdAt: 2 }));
  });

  it('learning collections are server-only', async () => {
    await assertFails(getDoc(doc(alice(), 'recipeStats/global__lettermark__recraft')));
    await assertFails(setDoc(doc(alice(), 'events/e1'), { type: 'picked' }));
  });
});
