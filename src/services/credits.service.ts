import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  increment,
  Firestore,
  DocumentReference,
  runTransaction,
  query,
  orderBy,
  limit,
  Query,
} from 'firebase/firestore';
import {
  CREDIT_COSTS,
  INITIAL_CREDITS,
  CREDIT_ACTION_LABELS,
  type CreditAction,
} from '@/lib/credits';

/**
 * Service for managing user credits.
 * Stores credit balance at userProfiles/{userId} and
 * transaction history at userProfiles/{userId}/transactions/{id}.
 */
export class CreditsService {
  constructor(private firestore: Firestore) {}

  /** Get the user profile document reference */
  getProfileDoc(userId: string): DocumentReference {
    return doc(this.firestore, `userProfiles/${userId}`);
  }

  /** Get a query for recent transactions */
  getTransactionsQuery(userId: string, count = 20): Query {
    return query(
      collection(this.firestore, `userProfiles/${userId}/transactions`),
      orderBy('createdAt', 'desc'),
      limit(count)
    );
  }

  /**
   * Initialize credits for a new user. Idempotent — won't overwrite
   * if the profile already exists.
   */
  async initializeCredits(userId: string): Promise<number> {
    const profileRef = this.getProfileDoc(userId);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      return profileSnap.data().balance ?? 0;
    }

    await setDoc(profileRef, {
      balance: INITIAL_CREDITS,
      totalPurchased: 0,
      totalUsed: 0,
      updatedAt: serverTimestamp(),
    });

    await addDoc(
      collection(this.firestore, `userProfiles/${userId}/transactions`),
      {
        userId,
        amount: INITIAL_CREDITS,
        balance: INITIAL_CREDITS,
        action: 'initial',
        description: 'Welcome credits',
        createdAt: serverTimestamp(),
      }
    );

    return INITIAL_CREDITS;
  }

  /**
   * Check if user has enough credits for an action.
   * Initializes profile if it doesn't exist.
   */
  async hasCredits(userId: string, action: CreditAction): Promise<boolean> {
    const cost = CREDIT_COSTS[action];
    const profileRef = this.getProfileDoc(userId);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      await this.initializeCredits(userId);
      return INITIAL_CREDITS >= cost;
    }

    return (profileSnap.data().balance ?? 0) >= cost;
  }

  /**
   * Deduct credits for an action. Uses a Firestore transaction
   * to prevent race conditions.
   * Returns the new balance, or throws if insufficient credits.
   */
  async deductCredits(userId: string, action: CreditAction): Promise<number> {
    const cost = CREDIT_COSTS[action];
    const profileRef = this.getProfileDoc(userId);

    const newBalance = await runTransaction(this.firestore, async (transaction) => {
      const profileSnap = await transaction.get(profileRef);

      if (!profileSnap.exists()) {
        // Initialize inline within the transaction
        const balance = INITIAL_CREDITS - cost;
        if (balance < 0) {
          throw new Error('Insufficient credits');
        }
        transaction.set(profileRef, {
          balance,
          totalPurchased: 0,
          totalUsed: cost,
          updatedAt: serverTimestamp(),
        });
        return balance;
      }

      const currentBalance = profileSnap.data().balance ?? 0;
      if (currentBalance < cost) {
        throw new Error('Insufficient credits');
      }

      const balance = currentBalance - cost;
      transaction.update(profileRef, {
        balance,
        totalUsed: increment(cost),
        updatedAt: serverTimestamp(),
      });
      return balance;
    });

    // Record transaction (outside the main transaction for simplicity)
    await addDoc(
      collection(this.firestore, `userProfiles/${userId}/transactions`),
      {
        userId,
        amount: -cost,
        balance: newBalance,
        action,
        description: CREDIT_ACTION_LABELS[action],
        createdAt: serverTimestamp(),
      }
    );

    return newBalance;
  }

  /**
   * Add credits from a purchase.
   */
  async addCredits(userId: string, amount: number, packageLabel: string): Promise<number> {
    const profileRef = this.getProfileDoc(userId);

    const newBalance = await runTransaction(this.firestore, async (transaction) => {
      const profileSnap = await transaction.get(profileRef);

      if (!profileSnap.exists()) {
        const balance = INITIAL_CREDITS + amount;
        transaction.set(profileRef, {
          balance,
          totalPurchased: amount,
          totalUsed: 0,
          updatedAt: serverTimestamp(),
        });
        return balance;
      }

      const currentBalance = profileSnap.data().balance ?? 0;
      const balance = currentBalance + amount;
      transaction.update(profileRef, {
        balance,
        totalPurchased: increment(amount),
        updatedAt: serverTimestamp(),
      });
      return balance;
    });

    await addDoc(
      collection(this.firestore, `userProfiles/${userId}/transactions`),
      {
        userId,
        amount,
        balance: newBalance,
        action: 'purchase',
        description: `Purchased ${packageLabel} pack (${amount} credits)`,
        createdAt: serverTimestamp(),
      }
    );

    return newBalance;
  }
}

/** Factory function to create a CreditsService instance */
export function createCreditsService(firestore: Firestore): CreditsService {
  return new CreditsService(firestore);
}
