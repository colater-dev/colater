'use client';
/* eslint-disable @next/next/no-img-element */
import { BRAND_FONTS } from '@/config/brand-fonts';
import type { PaletteColor } from '../../types';
import { markSlideColors } from '../../slide-specs';
import { useRecoloredMark } from '../../hooks/use-recolored-mark';

export function LockupSlide({ markUrl, name, fontName, palette }: { markUrl: string; name: string; fontName?: string; palette?: PaletteColor[] }) {
  const font = BRAND_FONTS.find(f => f.name === fontName) ?? BRAND_FONTS.find(f => f.name === 'Archivo')!;
  const c = markSlideColors(palette);
  const tinted = useRecoloredMark(markUrl, c.mark);
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-[4cqw] px-[8cqw] transition-colors duration-500" style={{ background: c.background, color: c.text }}>
      <img src={(c.mark && tinted) || markUrl} alt="" className="h-[28cqw] w-auto object-contain" />
      <span style={{ fontFamily: `var(${font.variable})`, fontSize: `${9 * font.sizeMultiplier}cqw` }} className="leading-none">
        {name}
      </span>
    </div>
  );
}
