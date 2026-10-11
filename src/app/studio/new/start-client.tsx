'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useRequireAuth } from '@/features/auth/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AUDIENCE_TAGS, STYLE_TAGS } from '@/lib/brand-tags';
import { TagPicker } from '@/features/studio/components/tag-picker';
import { suggestTags, createStudioBrand, startRound } from '@/app/studio/actions';
import { CREDIT_COSTS } from '@/lib/credits';

export function StartClient() {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [pitch, setPitch] = useState('');
  const [audience, setAudience] = useState<string[]>([]);
  const [style, setStyle] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const touched = useRef(false);

  useEffect(() => {
    if (!user || touched.current || !name.trim() || pitch.trim().length < 5) return;
    const t = setTimeout(async () => {
      setIsSuggesting(true);
      const res = await suggestTags(await user.getIdToken(), name, pitch);
      if (res.success && res.data && !touched.current) {
        setAudience(res.data.audience);
        setStyle(res.data.style);
      }
      setIsSuggesting(false);
    }, 700);
    return () => clearTimeout(t);
  }, [user, name, pitch]);

  const canStart = name.trim() && pitch.trim().length >= 5 && audience.length > 0 && style.length > 0 && !isStarting;

  const handleStart = async () => {
    if (!user || !canStart) return;
    setIsStarting(true);
    setError(null);
    const token = await user.getIdToken();
    const brand = await createStudioBrand(token, { name, pitch, audienceTags: audience, styleTags: style });
    if (!brand.success || !brand.data) { setError(brand.error ?? 'Could not create brand'); setIsStarting(false); return; }
    const round = await startRound(token, brand.data.brandId, crypto.randomUUID().replace(/-/g, ''));
    if (!round.success) setError(round.error ?? 'Could not start');
    router.push(`/studio/${brand.data.brandId}`);
  };

  if (isLoading || !user) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 pb-16 pt-24">
      <div className="space-y-3">
        <Input aria-label="Brand name" placeholder="Brand name" value={name} onChange={e => setName(e.target.value)} className="h-12 text-lg" maxLength={60} />
        <Input aria-label="What it does" placeholder="What does it do, in one sentence?" value={pitch} onChange={e => setPitch(e.target.value)} className="h-12" maxLength={200} />
      </div>
      <div className="space-y-6" onClickCapture={() => { touched.current = true; }}>
        {isSuggesting && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Suggesting tags…</p>}
        <TagPicker label="Who is it for?" tags={AUDIENCE_TAGS} selected={audience} onChange={setAudience} />
        <TagPicker label="How should it feel?" tags={STYLE_TAGS} selected={style} onChange={setStyle} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button size="lg" className="w-full" onClick={handleStart} disabled={!canStart}>
        {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Show me 3 directions · ${CREDIT_COSTS.studioRound} credits`}
      </Button>
    </main>
  );
}
