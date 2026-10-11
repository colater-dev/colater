'use client';

import { useEffect, useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react';
import { hexToRgb } from '@/lib/color-utils';
import { getProxyUrl } from '@/lib/image-utils';
import { measureInk, recolorPixels } from '@/lib/recolor';
import { capCenterShift, fitScale, lockupLayout } from '../lockup-layout';

interface TrimmedMark { src: string; aspect: number; density: number }
interface FontMetrics { ascent: number; descent: number; cap: number }

const FALLBACK_METRICS: FontMetrics = { ascent: 0.9, descent: 0.25, cap: 0.7 };
const metricsCache = new Map<string, FontMetrics>();

/** The mark recolored and cropped to its ink, so padding in the generated image never counts as size or gap. */
function useTrimmedMark(markUrl: string, hex: string): TrimmedMark | null {
  const [mark, setMark] = useState<TrimmedMark | null>(null);
  useEffect(() => {
    const ink = hexToRgb(hex);
    if (!ink) return;
    let alive = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      recolorPixels(data.data, ink);
      const box = measureInk(data.data, canvas.width, canvas.height);
      if (!box) return;
      ctx.putImageData(data, 0, 0);
      const out = document.createElement('canvas');
      out.width = box.width;
      out.height = box.height;
      out.getContext('2d')?.drawImage(canvas, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);
      if (alive) setMark({ src: out.toDataURL('image/png'), aspect: box.width / box.height, density: box.density });
    };
    img.src = getProxyUrl(markUrl);
    return () => { alive = false; };
  }, [markUrl, hex]);
  return mark;
}

/** Cap height, ascent and descent of a next/font family (per em), measured once it has loaded. */
function useFontMetrics(cssVariable: string): FontMetrics {
  const [, setLoaded] = useState(0);
  useEffect(() => {
    if (metricsCache.has(cssVariable)) return;
    const family = getComputedStyle(document.body).getPropertyValue(cssVariable).trim();
    if (!family) return;
    let alive = true;
    document.fonts.load(`100px ${family}`).then(() => {
      const ctx = document.createElement('canvas').getContext('2d');
      if (!ctx) return;
      ctx.font = `100px ${family}`;
      const t = ctx.measureText('H');
      const m = { ascent: t.fontBoundingBoxAscent / 100, descent: t.fontBoundingBoxDescent / 100, cap: t.actualBoundingBoxAscent / 100 };
      if (!(m.cap > 0)) return;
      metricsCache.set(cssVariable, m);
      if (alive) setLoaded(n => n + 1);
    }).catch(() => {});
    return () => { alive = false; };
  }, [cssVariable]);
  return metricsCache.get(cssVariable) ?? FALLBACK_METRICS;
}

/**
 * Horizontal lockup sizing. Everything is in em of the name's font size, which is set so the
 * capitals are `capCqw` tall, then scaled to fit `maxWidth` of the slide (growing at most `maxGrow`).
 */
export function useLockup({ rowRef, markUrl, markColor, fontVariable, text, capCqw, maxWidth = 0.8, maxGrow = 1 }: {
  /** The flex row holding mark and name; measured to fit the slide. */
  rowRef: RefObject<HTMLDivElement | null>;
  markUrl: string;
  markColor: string;
  fontVariable: string;
  text: string;
  capCqw: number;
  maxWidth?: number;
  maxGrow?: number;
}) {
  const mark = useTrimmedMark(markUrl, markColor);
  const metrics = useFontMetrics(fontVariable);
  const [scale, setScale] = useState(1);

  const layout = lockupLayout({ aspect: mark?.aspect ?? 1, density: mark?.density ?? 0.5 });
  const cap = metrics.cap; // cap height in em

  useLayoutEffect(() => {
    const row = rowRef.current;
    const box = row?.parentElement;
    if (!row || !box || !mark) return;
    const natural = row.offsetWidth / scale;
    const next = fitScale(natural, box.clientWidth * maxWidth, maxGrow);
    if (Math.abs(next - scale) > 0.01) setScale(next);
  }, [rowRef, mark, metrics, text, scale, maxWidth, maxGrow]);

  return {
    mark: mark?.src ?? null,
    rowStyle: { fontSize: `${(capCqw / cap) * scale}cqw`, gap: `${layout.gap * cap}em`, width: 'max-content' } satisfies CSSProperties,
    markStyle: { height: `${layout.markHeight * cap}em`, width: `${layout.markWidth * cap}em` } satisfies CSSProperties,
    textStyle: { display: 'inline-block', lineHeight: 1, transform: `translateY(${capCenterShift(metrics)}em)` } satisfies CSSProperties,
  };
}
