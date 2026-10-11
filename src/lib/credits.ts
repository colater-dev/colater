import type { FirestoreTimestamp } from './types';

/** Credit costs for each AI generation action */
export const CREDIT_COSTS = {
  logoGeneration: 10,
  logoColorization: 5,
  logoVectorization: 5,
  logoCritique: 3,
  logoConcept: 3,
  taglineGeneration: 2,
  presentationNarrative: 5,
  brandCompletion: 3,
  brandSuggestions: 3,
  studioRound: 15,
} as const;

/** Refund per failed direction in a Studio round (15 / 3). */
export const STUDIO_DIRECTION_REFUND = 5;

export type CreditAction = keyof typeof CREDIT_COSTS;

/** Display labels for credit actions */
export const CREDIT_ACTION_LABELS: Record<CreditAction, string> = {
  logoGeneration: 'Logo Generation',
  logoColorization: 'Logo Colorization',
  logoVectorization: 'Logo Vectorization',
  logoCritique: 'Logo Critique',
  logoConcept: 'Logo Concept',
  taglineGeneration: 'Tagline Generation',
  presentationNarrative: 'Presentation Narrative',
  brandCompletion: 'Brand Completion',
  brandSuggestions: 'Brand Suggestions',
  studioRound: 'Studio round (3 directions)',
};

/** Credit packages available for purchase */
export const CREDIT_PACKAGES: ReadonlyArray<{
  id: string;
  credits: number;
  price: number;
  label: string;
  popular?: boolean;
}> = [
  { id: 'pack-50', credits: 50, price: 5, label: 'Starter' },
  { id: 'pack-100', credits: 100, price: 9, label: 'Pro', popular: true },
  { id: 'pack-200', credits: 200, price: 15, label: 'Studio' },
];

/** Credits given to new users */
export const INITIAL_CREDITS = 50;

/** User credit balance stored in Firestore */
export interface UserCredits {
  id: string;
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  updatedAt: FirestoreTimestamp;
}

/** Individual credit transaction record */
export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number; // positive = added, negative = deducted
  balance: number; // balance after transaction
  action: CreditAction | 'purchase' | 'initial';
  description: string;
  createdAt: FirestoreTimestamp;
}
