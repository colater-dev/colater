import { LOGO_MODELS } from '@/ai/logo-models';
import type { StudioDirection } from './types';

export function stageLabel(d: Pick<StudioDirection, 'status' | 'stage' | 'recipe'>): string | null {
  if (d.status === 'ready' || d.status === 'failed') return null;
  if (d.status === 'pending' || !d.stage) return 'Starting…';
  if (d.stage === 'concept') return 'Writing the idea…';
  return `Drawing the mark with ${LOGO_MODELS[d.recipe.model].label}…`;
}
