'use client';
import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BRAND_FONTS } from '@/config/brand-fonts';
import { useRecoloredMark } from '../../hooks/use-recolored-mark';
import type { PaletteColor } from '../../types';

/** Logo reveal: the mark draws in from a circle, then the name slides in. Loops; click to replay. */
export function MotionSlide({ markUrl, name, fontName, palette }: { markUrl: string; name: string; fontName?: string; palette?: PaletteColor[] }) {
  const reduce = useReducedMotion();
  const [run, setRun] = useState(0);
  const c = Object.fromEntries((palette ?? []).map(p => [p.role, p.hex])) as Partial<Record<PaletteColor['role'], string>>;
  const background = c.primary ?? '#000000';
  const ink = c.background ?? '#FFFFFF';
  const mark = useRecoloredMark(markUrl, ink);
  const font = BRAND_FONTS.find(f => f.name === fontName) ?? BRAND_FONTS.find(f => f.name === 'Archivo')!;
  const loop = reduce ? undefined : { repeat: Infinity, repeatDelay: 2 };
  return (
    <button type="button" onClick={() => setRun(r => r + 1)} title="Click to replay"
      className="absolute inset-0 flex items-center justify-center gap-[3cqw]" style={{ background }}>
      {mark && (
        <motion.img key={`m${run}`} src={mark} alt="" className="h-[26cqw] w-auto object-contain"
          initial={reduce ? false : { clipPath: 'circle(0% at 50% 50%)', scale: 0.85, opacity: 0 }}
          animate={{ clipPath: 'circle(75% at 50% 50%)', scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], ...loop }} />
      )}
      <motion.span key={`n${run}`} className="leading-none"
        style={{ fontFamily: `var(${font.variable})`, fontSize: `${7 * font.sizeMultiplier}cqw`, color: ink }}
        initial={reduce ? false : { x: '-6cqw', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1], ...loop }}>
        {name}
      </motion.span>
    </button>
  );
}
