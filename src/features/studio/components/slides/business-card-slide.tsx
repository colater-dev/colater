'use client';
/* eslint-disable @next/next/no-img-element */
import { BRAND_FONTS } from '@/config/brand-fonts';
import { useRecoloredMark } from '../../hooks/use-recolored-mark';
import type { PaletteColor } from '../../types';

export function BusinessCardSlide({ markUrl, palette, name, fontName }: { markUrl: string; palette: PaletteColor[]; name: string; fontName?: string }) {
  const c = Object.fromEntries(palette.map(p => [p.role, p.hex])) as Record<PaletteColor['role'], string>;
  const light = useRecoloredMark(markUrl, c.background);
  const dark = useRecoloredMark(markUrl, c.primary);
  const font = BRAND_FONTS.find(f => f.name === fontName) ?? BRAND_FONTS.find(f => f.name === 'Archivo')!;
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-[5cqw] bg-neutral-200">
      <div className="flex h-[32cqw] w-[54cqw] -rotate-3 items-center justify-center rounded-[1.5cqw] shadow-lg" style={{ background: c.primary }}>
        {light && <img src={light} alt="" className="h-[16cqw] w-auto" />}
      </div>
      <div className="absolute bottom-[8cqw] right-[8cqw] flex h-[24cqw] w-[40cqw] rotate-2 items-center gap-[2cqw] rounded-[1.2cqw] px-[3cqw] shadow-md" style={{ background: c.background }}>
        {dark && <img src={dark} alt="" className="h-[8cqw] w-auto" />}
        <span style={{ fontFamily: `var(${font.variable})`, fontSize: '3.6cqw', color: c.ink }}>{name}</span>
      </div>
    </div>
  );
}
