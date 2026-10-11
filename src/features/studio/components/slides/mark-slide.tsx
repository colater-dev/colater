'use client';
/* eslint-disable @next/next/no-img-element */
import type { PaletteColor } from '../../types';
import { markSlideColors } from '../../slide-specs';
import { useRecoloredMark } from '../../hooks/use-recolored-mark';

export function MarkSlide({ markUrl, palette }: { markUrl: string; palette?: PaletteColor[] }) {
  const c = markSlideColors(palette);
  const tinted = useRecoloredMark(markUrl, c.mark);
  return (
    <div className="absolute inset-0 transition-colors duration-500" style={{ background: c.background }}>
      <img src={(c.mark && tinted) || markUrl} alt="Logo mark" className="absolute inset-0 m-auto h-[70%] w-auto object-contain" />
    </div>
  );
}
