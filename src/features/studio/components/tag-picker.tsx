'use client';

import type { BrandTag } from '@/lib/brand-tags';
import { cn } from '@/lib/utils';

export function TagPicker({ tags, selected, onChange, max = 5, label }: {
  tags: readonly BrandTag[];
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
  label: string;
}) {
  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter(s => s !== id));
    else if (selected.length < max) onChange([...selected, id]);
  };
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label} <span className="text-muted-foreground font-normal">· up to {max}</span></legend>
      <div className="flex flex-wrap gap-2">
        {tags.map(t => {
          const on = selected.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(t.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                on ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/40'
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
