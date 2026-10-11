'use client';

import { DirectionRow } from './direction-row';
import type { GenerateKind, StudioDirection } from '../types';

export function RoundBlock({ directions, brandName, onVariations, onToggleFavorite, onGenerate, isBusy }: {
  directions: StudioDirection[];
  brandName: string;
  onVariations: (directionId: string) => void;
  onToggleFavorite: (directionId: string) => void;
  onGenerate: (directionId: string, kind: GenerateKind, feedback?: { chips: string[]; note?: string }) => void;
  isBusy: (directionId: string, kind: GenerateKind) => boolean;
}) {
  return (
    <div className="space-y-8 border-b pb-10">
      {directions.map(d => (
        <DirectionRow
          key={d.id}
          direction={d}
          brandName={brandName}
          onVariations={() => onVariations(d.id)}
          onToggleFavorite={() => onToggleFavorite(d.id)}
          onGenerate={(k, f) => onGenerate(d.id, k, f)}
          busy={k => isBusy(d.id, k)}
        />
      ))}
    </div>
  );
}
