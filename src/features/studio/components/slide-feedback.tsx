'use client';

import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { SLIDE_FEEDBACK_CHIPS, GENERATE_COSTS, type FeedbackSlideKind } from '../types';

export function SlideFeedback({ kind, onApply }: {
  kind: FeedbackSlideKind;
  onApply: (feedback: { chips: string[]; note?: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [chips, setChips] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const cost = GENERATE_COSTS[kind];
  const apply = () => {
    onApply({ chips, note: note.trim() || undefined });
    setOpen(false); setChips([]); setNote('');
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Click to give feedback"
          className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs opacity-0 shadow transition-opacity group-hover:opacity-100 focus:opacity-100"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" /> Feedback
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3">
        <div className="flex flex-wrap gap-2">
          {SLIDE_FEEDBACK_CHIPS[kind].map(c => (
            <button key={c} type="button" aria-pressed={chips.includes(c)}
              onClick={() => setChips(cs => (cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c]))}
              className={cn('rounded-full border px-3 py-1 text-xs', chips.includes(c) ? 'border-foreground bg-foreground text-background' : 'hover:border-foreground/40')}>
              {c}
            </button>
          ))}
        </div>
        <Input placeholder="Anything else? (optional)" value={note} maxLength={200} onChange={e => setNote(e.target.value)} />
        <Button size="sm" className="w-full" onClick={apply} disabled={!chips.length && !note.trim()}>
          Redo this slide · {cost === 0 ? 'free' : `${cost} credits`}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
