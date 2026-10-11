import type { Recipe } from '@/ai/studio/recipes';
import type { DirectionConcept } from '@/ai/studio/direction-concept';
import type { FirestoreTimestamp } from '@/lib/types';
import { CREDIT_COSTS } from '@/lib/credits';

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
  paletteName?: string;
  stickerBg?: { url: string; title: string | null; creator: string | null; license: string; sourceUrl: string | null };
  error?: string;
  picked?: boolean;
  createdAt: FirestoreTimestamp;
  stage?: DirectionStage;
  slides?: DirectionSlides;
  chargeKey?: string;
  redoError?: string;
  favorite?: boolean;
}

export const ROUND_FEEDBACK_CHIPS = ['more playful', 'less literal', 'bolder', 'simpler'] as const;

export type DirectionStage = 'concept' | 'mark';
export type PaidSlideKind = 'color' | 'voice' | 'vector';
export type FeedbackSlideKind = 'mark' | 'lockup' | 'color' | 'voice';
export type GenerateKind = PaidSlideKind | 'mark' | 'lockup';

export interface PaletteColor {
  hex: string;
  name: string;
  role: 'primary' | 'secondary' | 'accent' | 'background' | 'ink';
}

export interface SlideState {
  status: 'pending' | 'ready' | 'failed';
  error?: string;
  requestedAt?: FirestoreTimestamp;
  chargeKey?: string;
  cost?: number;
}

export interface DirectionSlides {
  color?: SlideState & { palette?: PaletteColor[] };
  voice?: SlideState & { tagline?: string; story?: string };
  vector?: SlideState & { svgUrl?: string };
}

export const SLIDE_FEEDBACK_CHIPS: Record<FeedbackSlideKind, readonly string[]> = {
  mark: ['simpler', 'bolder', 'less literal', 'different shape', 'thinner lines'],
  lockup: ['different font', 'tighter', 'name larger'],
  color: ['warmer', 'cooler', 'more muted', 'more vivid'],
  voice: ['shorter', 'more playful', 'more serious'],
};

export const GENERATE_COSTS: Record<GenerateKind, number> = {
  color: 0, // re-picked from the palette library
  voice: CREDIT_COSTS.studioVoice,
  vector: CREDIT_COSTS.studioVector,
  mark: CREDIT_COSTS.studioMarkRedo,
  lockup: 0,
};
