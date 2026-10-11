'use client';

import { useState } from 'react';
import { AlertCircle, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SlideFrame } from './slide-frame';
import { SlidePlaceholder } from './slide-placeholder';
import { SlideFeedback } from './slide-feedback';
import { LockupSlide } from './slides/lockup-slide';
import { StickerSlide } from './slides/sticker-slide';
import { AppIconSlide } from './slides/app-icon-slide';
import { TypographySlide } from './slides/typography-slide';
import { MotionSlide } from './slides/motion-slide';
import { VariationsSlide } from './slides/variations-slide';
import { ColorSlide } from './slides/color-slide';
import { BusinessCardSlide } from './slides/business-card-slide';
import { SocialSlide } from './slides/social-slide';
import { VoiceSlide } from './slides/voice-slide';
import { VectorSlide } from './slides/vector-slide';
import { stageLabel } from '../stage-label';
import { nextLockupLayout, type LockupLayout } from '../lockup-layout';
import { nextMotionPreset, pickMotionPreset } from '../motion-presets';
import { GENERATE_COSTS, type GenerateKind, type PaidSlideKind, type StudioDirection } from '../types';

const PAID: { kind: Exclude<PaidSlideKind, 'color'>; label: string }[] = [
  { kind: 'voice', label: 'Voice' },
  { kind: 'vector', label: 'Vector file' },
];

export function DirectionRow({ direction, brandName, onVariations, onToggleFavorite, onGenerate, busy }: {
  direction: StudioDirection;
  brandName: string;
  onVariations: () => void;
  onToggleFavorite: () => void;
  onGenerate: (kind: GenerateKind, feedback?: { chips: string[]; note?: string }) => void;
  busy: (kind: GenerateKind) => boolean;
}) {
  const { status, concept, markUrl, fontName, slides = {} } = direction;
  const ready = status === 'ready' && !!markUrl;
  const frame = ready ? 'ready' : 'loading';
  const progress = stageLabel(direction);
  // Palettes are picked with the mark; a re-pick keeps the old colors on screen until the new ones land.
  const palette = slides.color?.palette;
  const colorPending = slides.color?.status === 'pending' || busy('color');
  const voice = slides.voice?.status === 'ready' ? slides.voice : undefined;
  // Slides 1 and 2 are the same mark/lockup in different layouts; each click moves one on.
  const [layouts, setLayouts] = useState<[LockupLayout, LockupLayout]>(['mark', 'horizontal']);
  const cycle = (i: 0 | 1) => setLayouts(ls => (i === 0 ? [nextLockupLayout(ls[0]), ls[1]] : [ls[0], nextLockupLayout(ls[1])]));
  const [motionPreset, setMotionPreset] = useState(() => pickMotionPreset(direction.id));
  const lockupCaption = (l: LockupLayout) => (l === 'mark' ? concept?.captions.mark : concept?.captions.lockup);
  const fb = (kind: 'mark' | 'lockup' | 'color' | 'voice') => <SlideFeedback kind={kind} onApply={f => onGenerate(kind, f)} />;

  if (status === 'failed') {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{concept?.idea ? `“${concept.idea}” couldn't be drawn` : "This direction couldn't be generated"}; its credits were refunded.</span>
        <Button size="sm" variant="outline" onClick={() => onGenerate('mark')} disabled={busy('mark')}>
          {busy('mark') ? <Loader2 className="h-3 w-3 animate-spin" /> : `Retry · ${GENERATE_COSTS.mark} credits`}
        </Button>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm">{concept?.idea ?? ' '}</p>
          {progress && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />{progress}</p>}
          {!progress && direction.redoError && <p className="text-xs text-muted-foreground">The last redo didn&apos;t work; its credits were refunded.</p>}
        </div>
        {ready && (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              aria-pressed={!!direction.favorite}
              aria-label={direction.favorite ? 'Remove from favorites' : 'Add to favorites'}
              title={direction.favorite ? 'Remove from favorites' : 'Add to favorites'}
              onClick={onToggleFavorite}
            >
              <Heart className={cn('h-4 w-4', direction.favorite && 'fill-red-500 text-red-500')} />
            </Button>
            <Button size="sm" variant="outline" onClick={onVariations}>More like this</Button>
          </div>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {([0, 1] as const).map(i => (
          <SlideFrame key={i} status={frame} caption={lockupCaption(layouts[i])} overlay={fb(i === 0 ? 'mark' : 'lockup')}>
            {markUrl && <LockupSlide markUrl={markUrl} name={brandName} fontName={fontName} palette={palette} layout={layouts[i]} onNext={() => cycle(i)} />}
          </SlideFrame>
        ))}
        <SlideFrame status={frame} caption={`In motion · ${motionPreset.label}`}>
          {markUrl && <MotionSlide markUrl={markUrl} name={brandName} fontName={fontName} palette={palette} preset={motionPreset} onNext={() => setMotionPreset(p => nextMotionPreset(p.id))} />}
        </SlideFrame>
        <SlideFrame status={frame} caption={direction.stickerBg && concept?.stickerSurface ? `Sticker · ${concept.stickerSurface}` : concept?.captions.inUse ?? 'On a laptop'}>{markUrl && <StickerSlide markUrl={markUrl} backgroundUrl={direction.stickerBg?.url} />}</SlideFrame>
        <SlideFrame status={frame} caption="App icon">{markUrl && <AppIconSlide markUrl={markUrl} name={brandName} color={palette?.find(p => p.role === 'primary')?.hex} />}</SlideFrame>
        <SlideFrame status={frame} caption="Type hierarchy" overlay={fb('lockup')}>{markUrl && <TypographySlide name={brandName} fontName={fontName} sample={concept?.typeSample} tagline={voice?.tagline} />}</SlideFrame>
        <SlideFrame status={frame} caption="Variations">{markUrl && <VariationsSlide markUrl={markUrl} palette={palette} />}</SlideFrame>
        {ready && palette && <SlideFrame status={colorPending ? 'loading' : 'ready'} caption="Color" overlay={fb('color')}><ColorSlide markUrl={markUrl!} palette={palette} /></SlideFrame>}
        {ready && palette && <SlideFrame status="ready" caption="Business card"><BusinessCardSlide markUrl={markUrl!} palette={palette} name={brandName} fontName={fontName} /></SlideFrame>}
        {ready && palette && <SlideFrame status="ready" caption="Social profile"><SocialSlide markUrl={markUrl!} palette={palette} name={brandName} tagline={voice?.tagline} /></SlideFrame>}
        {ready && voice && <SlideFrame status="ready" caption="Voice" overlay={fb('voice')}><VoiceSlide tagline={voice.tagline!} story={voice.story!} palette={palette} /></SlideFrame>}
        {ready && slides.vector?.status === 'ready' && <SlideFrame status="ready" caption="Vector"><VectorSlide svgUrl={slides.vector.svgUrl!} name={brandName} /></SlideFrame>}
        {ready && PAID.filter(p => slides[p.kind]?.status !== 'ready').map(p => (
          <SlidePlaceholder
            key={p.kind}
            label={p.label}
            cost={GENERATE_COSTS[p.kind]}
            state={slides[p.kind]?.status === 'pending' || busy(p.kind) ? 'pending' : slides[p.kind]?.status === 'failed' ? 'failed' : 'idle'}
            onGenerate={() => onGenerate(p.kind)}
          />
        ))}
      </div>
    </section>
  );
}
