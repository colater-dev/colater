'use client';

import { DirectionRow } from './direction-row';
import type { GenerateKind, StudioDirection } from '../types';

export function RoundBlock({ directions, brandName, onPick, onVariations, onGenerate, isBusy }: {
  directions: StudioDirection[];
  brandName: string;
  onPick: (directionId: string) => void;
  onVariations: (directionId: string) => void;
  onGenerate: (directionId: string, kind: GenerateKind, feedback?: { chips: string[]; note?: string }) => void;
  isBusy: (directionId: string, kind: GenerateKind) => boolean;
}) {
  const pickedId = directions.find(d => d.picked)?.id;
  return (
    <div className="space-y-8 border-b pb-10">
      {directions.map(d => (
        <DirectionRow
          key={d.id}
          direction={d}
          brandName={brandName}
          collapsed={!!pickedId && pickedId !== d.id}
          onPick={() => onPick(d.id)}
          onVariations={() => onVariations(d.id)}
          onGenerate={(k, f) => onGenerate(d.id, k, f)}
          busy={k => isBusy(d.id, k)}
        />
      ))}
    </div>
  );
}
