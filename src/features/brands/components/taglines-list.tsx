'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, Plus, Star, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tagline } from '@/lib/types';
import { useState, useCallback } from 'react';

interface TaglinesListProps {
  taglines: Tagline[];
  isLoading: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
  onStatusUpdate: (taglineId: string, status: 'liked' | 'disliked') => void;
  onEdit: (taglineId: string, text: string) => void;
}

export function TaglinesList({
  taglines,
  isLoading,
  isGenerating,
  onGenerate,
  onStatusUpdate,
  onEdit,
}: TaglinesListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  const startEditing = useCallback((item: Tagline) => {
    setEditingId(item.id);
    setEditingValue(item.tagline);
  }, []);

  const stopEditing = useCallback(() => {
    setEditingId(null);
    setEditingValue('');
  }, []);

  const handleBlurSave = useCallback(() => {
    if (editingId != null) {
      onEdit(editingId, editingValue.trim());
    }
    stopEditing();
  }, [editingId, editingValue, onEdit, stopEditing]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        (e.target as HTMLInputElement).blur();
      } else if (e.key === 'Escape') {
        stopEditing();
      }
    },
    [stopEditing]
  );
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" /> AI Generated Taglines
          </CardTitle>
          <CardDescription>More catchy taglines for your brand.</CardDescription>
        </div>
        <Button onClick={onGenerate} disabled={isGenerating} size="sm">
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 animate-spin" />
              Writing taglines...
            </>
          ) : (
            <>
              <Plus className="mr-2" />
              New Tagline
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && taglines.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : taglines.length > 0 ? (
          <ul className="space-y-4">
            {taglines.map((item) => (
              <li
                key={item.id}
                className="group flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
              >
                <div className="flex-1 pr-4">
                  {editingId === item.id ? (
                    <input
                      autoFocus
                      className="w-full bg-transparent outline-none border-b border-transparent focus:border-border"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={handleBlurSave}
                      onKeyDown={handleKeyDown}
                      placeholder="Edit tagline"
                      aria-label="Edit tagline"
                    />
                  ) : (
                    <button
                      type="button"
                      className="text-left w-full"
                      onClick={() => startEditing(item)}
                    >
                      {item.tagline}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Swap order: delete first, then star */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onStatusUpdate(item.id, 'disliked')}
                    className="transition-opacity md:opacity-0 md:group-hover:opacity-100"
                    aria-label="Delete tagline"
                    title="Delete tagline"
                  >
                    <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onStatusUpdate(item.id, 'liked')}
                    className={cn(
                      'transition-opacity',
                      item.status === 'liked'
                        ? 'opacity-100'
                        : 'md:opacity-0 md:group-hover:opacity-100'
                    )}
                    aria-label={item.status === 'liked' ? 'Unstar tagline' : 'Star tagline'}
                    title={item.status === 'liked' ? 'Unstar tagline' : 'Star tagline'}
                  >
                    <Star
                      className={cn(
                        'h-5 w-5',
                        item.status === 'liked'
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-muted-foreground'
                      )}
                    />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">
              No taglines generated yet. Click the button to start.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
