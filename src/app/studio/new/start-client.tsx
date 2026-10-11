'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useRequireAuth } from '@/features/auth/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ELEVATOR_PITCH_MAX } from '@/lib/brand-limits';
import { AUDIENCE_TAGS, STYLE_TAGS, AUDIENCE_MAX, STYLE_MAX, sortTagsByScore } from '@/lib/brand-tags';
import { TagPicker } from '@/features/studio/components/tag-picker';
import { suggestTags, createStudioBrand, startRound } from '@/app/studio/actions';
import { CREDIT_COSTS } from '@/lib/credits';
import { useCredits } from '@/hooks/use-credits';

export function StartClient() {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [pitch, setPitch] = useState('');
  const [audience, setAudience] = useState<string[]>([]);
  const [style, setStyle] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const touched = useRef(false);
  const { balance, isLoading: creditsLoading } = useCredits();
  const brandIdRef = useRef<string | null>(null);
  const roundIdRef = useRef<string | null>(null);
  const cost = CREDIT_COSTS.studioRound;
  const shortfall = !creditsLoading && balance < cost;

  useEffect(() => {
    if (!user || touched.current || !name.trim() || pitch.trim().length < 5) return;
    const t = setTimeout(async () => {
      setIsSuggesting(true);
      const res = await suggestTags(await user.getIdToken(), name, pitch);
      if (res.success && res.data && !touched.current) {
        setAudience(res.data.audience);
        setStyle(res.data.style);
        setScores(res.data.scores);
      }
      setIsSuggesting(false);
    }, 700);
    return () => clearTimeout(t);
  }, [user, name, pitch]);

  const sortedAudience = useMemo(() => sortTagsByScore(AUDIENCE_TAGS, scores), [scores]);
  const sortedStyle = useMemo(() => sortTagsByScore(STYLE_TAGS, scores), [scores]);
  const goodFit = useMemo(() => Object.keys(scores).filter(id => scores[id] >= 0.6), [scores]);

  const canStart = name.trim() && pitch.trim().length >= 5 && audience.length > 0 && style.length > 0 && !isStarting && !shortfall;

  const handleStart = async () => {
    if (!user || !canStart) return;
    setIsStarting(true);
    setError(null);
    const token = await user.getIdToken();
    if (!brandIdRef.current) {
      const brand = await createStudioBrand(token, { name, pitch, audienceTags: audience, styleTags: style });
      if (!brand.success || !brand.data) { setError(brand.error ?? 'Could not create brand'); setIsStarting(false); return; }
      brandIdRef.current = brand.data.brandId;
    }
    roundIdRef.current ??= crypto.randomUUID().replace(/-/g, '');
    const round = await startRound(token, brandIdRef.current, roundIdRef.current);
    roundIdRef.current = null;
    if (!round.success) { setError(round.error ?? 'Could not start'); setIsStarting(false); return; }
    router.push(`/studio/${brandIdRef.current}`);
  };

  if (isLoading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 pb-16 pt-24">
      <div className="space-y-3">
        <Input aria-label="Brand name" placeholder="Brand name" value={name} onChange={e => setName(e.target.value)} className="h-12 text-lg" maxLength={60} />
        <Textarea aria-label="What it does" placeholder="What does it do?" value={pitch} onChange={e => setPitch(e.target.value)} rows={3} maxLength={ELEVATOR_PITCH_MAX} />
      </div>
      <div className="space-y-6" onClickCapture={() => { touched.current = true; }}>
        {isSuggesting && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Suggesting tags…</p>}
        <TagPicker label="Who is it for?" tags={sortedAudience} selected={audience} onChange={setAudience} max={AUDIENCE_MAX} suggested={goodFit} />
        <TagPicker label="How should it feel?" tags={sortedStyle} selected={style} onChange={setStyle} max={STYLE_MAX} suggested={goodFit} />
      </div>
      {shortfall && (
        <p className="text-sm text-muted-foreground">
          A round of 3 directions costs {cost} credits; you have {balance}. <Link href="/credits" className="underline">Get credits</Link>
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error} {error.includes('credits') && <Link href="/credits" className="underline">Get credits</Link>}</p>}
      <Button size="lg" className="w-full" onClick={handleStart} disabled={!canStart}>
        {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Show me 3 directions · ${cost} credits`}
      </Button>
    </main>
  );
}
