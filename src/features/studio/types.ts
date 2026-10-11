import type { Recipe } from '@/ai/studio/recipes';
import type { DirectionConcept } from '@/ai/studio/direction-concept';
import type { FirestoreTimestamp } from '@/lib/types';

export type DirectionStatus = 'pending' | 'generating' | 'ready' | 'failed';

export interface StudioRound {
  id: string;
  createdAt: FirestoreTimestamp;
  feedbackChips: string[];
  seedDirectionId?: string | null;
}

export interface StudioDirection {
  id: string;
  roundId: string;
  order: number;
  recipe: Recipe;
  status: DirectionStatus;
  concept?: DirectionConcept;
  markUrl?: string;
  fontName?: string;
  error?: string;
  picked?: boolean;
  createdAt: FirestoreTimestamp;
}

export const ROUND_FEEDBACK_CHIPS = ['more playful', 'less literal', 'bolder', 'simpler'] as const;
