import { BRAND_FONTS } from '@/config/brand-fonts';

export function TypographySlide({ name, fontName, sample }: { name: string; fontName?: string; sample?: { headline: string; body: string } }) {
  const font = BRAND_FONTS.find(f => f.name === fontName) ?? BRAND_FONTS.find(f => f.name === 'Archivo')!;
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-[2.5cqw] px-[8cqw]">
      <span style={{ fontFamily: `var(${font.variable})`, fontSize: `${8 * font.sizeMultiplier}cqw` }} className="leading-[1.05]">
        {sample?.headline ?? name}
      </span>
      {sample?.body && <span style={{ fontSize: '2.8cqw' }} className="font-sans leading-snug text-neutral-700">{sample.body}</span>}
      <span style={{ fontSize: '2.2cqw' }} className="font-sans text-muted-foreground">{font.name} · Geist Sans</span>
    </div>
  );
}
