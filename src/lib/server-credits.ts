/** Credits ledger written only by the server (Admin SDK). Charges are idempotent by key and refundable. */
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { INITIAL_CREDITS, CREDIT_ACTION_LABELS, type CreditAction } from './credits';

export class InsufficientCreditsError extends Error {
  constructor(public needed: number, public balance: number) {
    super(`Not enough credits: need ${needed}, have ${balance}`);
    this.name = 'InsufficientCreditsError';
  }
}

export function createServerCredits(db: Firestore) {
  const profileRef = (uid: string) => db.doc(`userProfiles/${uid}`);
  const ledgerRef = (uid: string) => db.collection(`userProfiles/${uid}/transactions`).doc();
  const chargeRef = (uid: string, key: string) => db.doc(`userProfiles/${uid}/charges/${key}`);

  async function ensureProfile(uid: string): Promise<number> {
    return db.runTransaction(async tx => {
      const snap = await tx.get(profileRef(uid));
      if (snap.exists) return snap.data()?.balance ?? 0;
      tx.create(profileRef(uid), { balance: INITIAL_CREDITS, totalPurchased: 0, totalUsed: 0, updatedAt: FieldValue.serverTimestamp() });
      tx.create(ledgerRef(uid), { userId: uid, amount: INITIAL_CREDITS, balance: INITIAL_CREDITS, action: 'initial', description: 'Welcome credits', createdAt: FieldValue.serverTimestamp() });
      return INITIAL_CREDITS;
    });
  }

  async function charge({ uid, amount, action, key }: { uid: string; amount: number; action: CreditAction; key: string }) {
    await ensureProfile(uid);
    return db.runTransaction(async tx => {
      const [profile, existing] = await Promise.all([tx.get(profileRef(uid)), tx.get(chargeRef(uid, key))]);
      const balance: number = profile.data()?.balance ?? 0;
      if (existing.exists) return { balance, alreadyCharged: true };
      if (balance < amount) throw new InsufficientCreditsError(amount, balance);
      const newBalance = balance - amount;
      tx.update(profileRef(uid), { balance: newBalance, totalUsed: FieldValue.increment(amount), updatedAt: FieldValue.serverTimestamp() });
      tx.create(chargeRef(uid, key), { amount, refunded: 0, action, createdAt: FieldValue.serverTimestamp() });
      tx.create(ledgerRef(uid), { userId: uid, amount: -amount, balance: newBalance, action, description: CREDIT_ACTION_LABELS[action], createdAt: FieldValue.serverTimestamp() });
      return { balance: newBalance, alreadyCharged: false };
    });
  }

  async function refund({ uid, key, amount, reason }: { uid: string; key: string; amount: number; reason: string }) {
    return db.runTransaction(async tx => {
      const [profile, chargeSnap] = await Promise.all([tx.get(profileRef(uid)), tx.get(chargeRef(uid, key))]);
      const balance: number = profile.data()?.balance ?? 0;
      if (!chargeSnap.exists) return { balance, refunded: 0 };
      const { amount: charged = 0, refunded: already = 0, action } = chargeSnap.data() ?? {};
      const refundable = Math.max(0, Math.min(amount, charged - already));
      if (refundable === 0) return { balance, refunded: 0 };
      const newBalance = balance + refundable;
      tx.update(profileRef(uid), { balance: newBalance, totalUsed: FieldValue.increment(-refundable), updatedAt: FieldValue.serverTimestamp() });
      tx.update(chargeRef(uid, key), { refunded: already + refundable });
      tx.create(ledgerRef(uid), { userId: uid, amount: refundable, balance: newBalance, action, description: `Refund: ${reason}`, createdAt: FieldValue.serverTimestamp() });
      return { balance: newBalance, refunded: refundable };
    });
  }

  return { ensureProfile, charge, refund };
}

export type ServerCredits = ReturnType<typeof createServerCredits>;
