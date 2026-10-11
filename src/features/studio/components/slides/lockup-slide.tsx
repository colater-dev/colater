'use client';
/* eslint-disable @next/next/no-img-element */
import { useRef } from 'react';
import { BRAND_FONTS } from '@/config/brand-fonts';
import type { PaletteColor } from '../../types';
import { markSlideColors } from '../../slide-specs';
import { useLockup } from '../../hooks/use-lockup';

export function LockupSlide({ markUrl, name, fontName, palette }: { markUrl: string; name: string; fontName?: string; palette?: PaletteColor[] }) {
  const font = BRAND_FONTS.find(f => f.name === fontName) ?? BRAND_FONTS.find(f => f.name === 'Archivo')!;
  const c = markSlideColors(palette);
  const rowRef = useRef<HTMLDivElement>(null);
  const l = useLockup({ rowRef, markUrl, markColor: c.mark ?? '#000000', fontVariable: font.variable, text: name, capCqw: 6, maxWidth: 0.7, maxGrow: 1.3 });
  return (
    <div className="absolute inset-0 flex items-center justify-center transition-colors duration-500" style={{ background: c.background, color: c.text }}>
      <div ref={rowRef} className="flex items-center" style={{ ...l.rowStyle, fontFamily: `var(${font.variable})`, visibility: l.mark ? 'visible' : 'hidden' }}>
        {l.mark && <img src={l.mark} alt="" className="shrink-0" style={l.markStyle} />}
        <span className="whitespace-nowrap" style={l.textStyle}>{name}</span>
      </div>
    </div>
  );
}
