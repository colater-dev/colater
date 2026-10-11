'use client';

import { DirectionRow } from './direction-row';
import type { StudioDirection, StudioRound } from '../types';

export function RoundBlock({ round, directions, brandName, index, onPick, onVariations }: {
  round: StudioRound;
  directions: StudioDirection[];
  brandName: string;
  index: number;
  onPick: (directionId: string) => void;
  onVariations: (directionId: string) => void;
}) {
  const pickedId = directions.find(d => d.picked)?.id;
  return (
    <div className="space-y-8 border-b pb-10">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        Round {index}{round.feedbackChips?.length ? ` · ${round.feedbackChips.join(', ')}` : ''}
      </p>
      {directions.map(d => (
        <DirectionRow
          key={d.id}
          direction={d}
          brandName={brandName}
          collapsed={!!pickedId && pickedId !== d.id}
          onPick={() => onPick(d.id)}
          onVariations={() => onVariations(d.id)}
        />
      ))}
    </div>
  );
}
