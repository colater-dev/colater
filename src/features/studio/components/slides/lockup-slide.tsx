'use client';
/* eslint-disable @next/next/no-img-element */
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { BRAND_FONTS } from '@/config/brand-fonts';
import type { PaletteColor } from '../../types';
import { markSlideColors } from '../../slide-specs';
import type { LockupLayout } from '../../lockup-layout';
import { useLockup } from '../../hooks/use-lockup';

const FIT: Record<LockupLayout, { maxWidth: number; maxHeight: number; maxGrow: number }> = {
  mark: { maxWidth: 0.55, maxHeight: 0.5, maxGrow: 10 },
  horizontal: { maxWidth: 0.7, maxHeight: 0.6, maxGrow: 1.3 },
  stacked: { maxWidth: 0.62, maxHeight: 0.72, maxGrow: 1.3 },
};

/** The mark alone, beside the name, or above it, in palette colors. Click to switch layout. */
export function LockupSlide({ markUrl, name, fontName, palette, layout, onNext }: {
  markUrl: string;
  name: string;
  fontName?: string;
  palette?: PaletteColor[];
  layout: LockupLayout;
  onNext: () => void;
}) {
  const font = BRAND_FONTS.find(f => f.name === fontName) ?? BRAND_FONTS.find(f => f.name === 'Archivo')!;
  const c = markSlideColors(palette);
  const rowRef = useRef<HTMLDivElement>(null);
  const l = useLockup({ rowRef, layout, markUrl, markColor: c.mark ?? '#000000', fontVariable: font.variable, text: name, capCqw: 6, ...FIT[layout] });
  return (
    <button type="button" onClick={onNext} title="Click to switch layout"
      className="absolute inset-0 flex items-center justify-center transition-colors duration-500" style={{ background: c.background, color: c.text }}>
      <motion.div key={layout} ref={rowRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
        style={{ ...l.rowStyle, fontFamily: `var(${font.variable})`, visibility: l.mark ? 'visible' : 'hidden' }}>
        {l.mark && <img src={l.mark} alt={layout === 'mark' ? 'Logo mark' : ''} style={l.markStyle} />}
        {l.showText && <span className="whitespace-nowrap" style={l.textStyle}>{name}</span>}
      </motion.div>
    </button>
  );
}
