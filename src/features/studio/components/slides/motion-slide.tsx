'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, type MotionProps, type Transition } from 'framer-motion';
import { BRAND_FONTS } from '@/config/brand-fonts';
import { useLockup } from '../../hooks/use-lockup';
import type { MotionPreset } from '../../motion-presets';
import type { PaletteColor } from '../../types';

const PAUSE_MS = 1800;

/** Logo reveal using one of the motion presets. Loops; click to try another preset. */
export function MotionSlide({ markUrl, name, fontName, palette, preset, onNext }: {
  markUrl: string;
  name: string;
  fontName?: string;
  palette?: PaletteColor[];
  preset: MotionPreset;
  onNext: () => void;
}) {
  const reduce = useReducedMotion();
  const [run, setRun] = useState(0);
  const c = Object.fromEntries((palette ?? []).map(p => [p.role, p.hex])) as Partial<Record<PaletteColor['role'], string>>;
  const background = c.primary ?? '#000000';
  const ink = c.background ?? '#FFFFFF';
  const font = BRAND_FONTS.find(f => f.name === fontName) ?? BRAND_FONTS.find(f => f.name === 'Archivo')!;
  const rowRef = useRef<HTMLDivElement>(null);
  const l = useLockup({ rowRef, markUrl, markColor: ink, fontVariable: font.variable, text: name, capCqw: 5, maxWidth: 0.7, maxGrow: 1.3 });
  const letters = Array.from(name);

  // Replay by remounting, so mark and name always restart together.
  useEffect(() => {
    if (reduce) return;
    const period = preset.durationMs + (preset.letterStagger ?? 0) * letters.length * 1000 + PAUSE_MS;
    const t = setInterval(() => setRun(r => r + 1), period);
    return () => clearInterval(t);
  }, [reduce, preset, letters.length]);

  const play = (a: MotionPreset['mark'], delay = 0): MotionProps => {
    if (reduce) return { initial: false };
    const transition: Transition = { ...a.transition, delay: ((a.transition as { delay?: number }).delay ?? 0) + delay };
    return { initial: a.initial, animate: a.animate, transition };
  };

  return (
    <button type="button" onClick={onNext} title="Click to try another animation"
      className="absolute inset-0 flex items-center justify-center" style={{ background }}>
      <div ref={rowRef} key={`${preset.id}${run}`} style={{ ...l.rowStyle, fontFamily: `var(${font.variable})`, visibility: l.mark ? 'visible' : 'hidden' }}>
        {l.mark && <motion.img src={l.mark} alt="" style={l.markStyle} {...play(preset.mark)} />}
        <span className="whitespace-nowrap" style={{ ...l.textStyle, color: ink }}>
          {preset.letterStagger
            ? letters.map((ch, i) => (
              <motion.span key={i} className="inline-block" {...play(preset.name, i * preset.letterStagger!)}>{ch === ' ' ? ' ' : ch}</motion.span>
            ))
            : <motion.span className="inline-block" {...play(preset.name)}>{name}</motion.span>}
        </span>
      </div>
    </button>
  );
}
