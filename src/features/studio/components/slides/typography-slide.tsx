import { BRAND_FONTS } from '@/config/brand-fonts';
import { typeLevels } from '../../slide-specs';

const SIZES = { Display: 7.5, Subhead: 3.6, Body: 2.4, Caption: 1.8 } as const;

export function TypographySlide({ name, fontName, sample, tagline }: {
  name: string;
  fontName?: string;
  sample?: { headline: string; body: string };
  tagline?: string;
}) {
  const font = BRAND_FONTS.find(f => f.name === fontName) ?? BRAND_FONTS.find(f => f.name === 'Archivo')!;
  const levels = typeLevels({ name, sample, tagline, fontName: font.name });
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-[2cqw] px-[7cqw]">
      {levels.map(l => {
        const brandFont = l.role === 'Display' || l.role === 'Subhead';
        return (
          <div key={l.role} className="flex items-baseline gap-[2.5cqw]">
            <span className="w-[10cqw] shrink-0 font-sans text-muted-foreground" style={{ fontSize: '1.5cqw' }}>{l.role}</span>
            <span
              className={brandFont ? 'leading-[1.05]' : 'font-sans leading-snug text-neutral-700'}
              style={{ fontSize: `${SIZES[l.role] * (brandFont ? font.sizeMultiplier : 1)}cqw`, fontFamily: brandFont ? `var(${font.variable})` : undefined }}
            >
              {l.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
