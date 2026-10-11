'use client';

import { useState } from 'react';
import type { BrandTag } from '@/lib/brand-tags';
import { cn } from '@/lib/utils';

const VISIBLE = 16;

/** Tags arrive ordered by fit; strong matches are highlighted, and the long tail sits behind "more". */
export function TagPicker({ tags, selected, onChange, max = 5, label, suggested = [] }: {
  tags: readonly BrandTag[];
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
  label: string;
  suggested?: string[];
}) {
  const [showAll, setShowAll] = useState(false);
  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter(s => s !== id));
    else if (selected.length < max) onChange([...selected, id]);
  };
  const visible = showAll ? tags : tags.filter((t, i) => i < VISIBLE || selected.includes(t.id));
  const hidden = tags.length - visible.length;
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label} <span className="text-muted-foreground font-normal">· up to {max}</span></legend>
      <div className="flex flex-wrap gap-2">
        {visible.map(t => {
          const on = selected.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(t.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                on ? 'border-foreground bg-foreground text-background'
                  : suggested.includes(t.id) ? 'border-foreground/50 bg-muted hover:border-foreground'
                  : 'border-border hover:border-foreground/40'
              )}
            >
              {t.label}
            </button>
          );
        })}
        {(hidden > 0 || showAll) && (
          <button type="button" onClick={() => setShowAll(v => !v)} className="rounded-full px-3 py-1 text-sm text-muted-foreground underline-offset-4 hover:underline">
            {showAll ? 'Show fewer' : `+${hidden} more`}
          </button>
        )}
      </div>
    </fieldset>
  );
}
