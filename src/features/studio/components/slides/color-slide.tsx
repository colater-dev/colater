'use client';
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import { useRecoloredMark } from '../../hooks/use-recolored-mark';
import { markColorOptions } from '../../mark-colors';
import type { PaletteColor } from '../../types';

export function ColorSlide({ markUrl, palette }: { markUrl: string; palette: PaletteColor[] }) {
  const byRole = Object.fromEntries(palette.map(c => [c.role, c])) as Record<PaletteColor['role'], PaletteColor>;
  const options = markColorOptions(palette);
  const [index, setIndex] = useState(0);
  const active = options[index % Math.max(options.length, 1)];
  const colored = useRecoloredMark(markUrl, active?.hex);
  return (
    <button
      type="button"
      onClick={() => setIndex(i => i + 1)}
      title="Click to try the mark in another palette color"
      className="absolute inset-0 flex cursor-pointer text-left"
      style={{ background: byRole.background?.hex }}
    >
      <div className="relative flex flex-1 items-center justify-center">
        {colored && <img src={colored} alt="Colored mark" className="h-[45cqw] w-auto object-contain" />}
        {active && (
          <span className="absolute bottom-[3cqw] left-[3cqw]" style={{ fontSize: '2.2cqw', color: byRole.ink?.hex }}>
            {active.name} · {(index % options.length) + 1}/{options.length}
          </span>
        )}
      </div>
      <div className="flex h-full w-[30cqw] flex-col">
        {palette.map(c => (
          <div key={c.role} className="flex flex-1 items-end p-[1.5cqw]" style={{ background: c.hex, outline: c.hex === active?.hex ? `0.4cqw solid ${byRole.ink?.hex}` : undefined, outlineOffset: '-0.4cqw' }}>
            <span style={{ fontSize: '2.2cqw', color: c.role === 'ink' || c.role === 'primary' ? byRole.background?.hex : byRole.ink?.hex }}>
              {c.name} · {c.hex.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </button>
  );
}
