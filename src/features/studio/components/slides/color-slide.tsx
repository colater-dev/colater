'use client';
/* eslint-disable @next/next/no-img-element */
import { useRecoloredMark } from '../../hooks/use-recolored-mark';
import type { PaletteColor } from '../../types';

export function ColorSlide({ markUrl, palette }: { markUrl: string; palette: PaletteColor[] }) {
  const byRole = Object.fromEntries(palette.map(c => [c.role, c])) as Record<PaletteColor['role'], PaletteColor>;
  const colored = useRecoloredMark(markUrl, byRole.primary?.hex);
  return (
    <div className="absolute inset-0 flex" style={{ background: byRole.background?.hex }}>
      <div className="flex flex-1 items-center justify-center">
        {colored && <img src={colored} alt="Colored mark" className="h-[45cqw] w-auto object-contain" />}
      </div>
      <div className="flex w-[30cqw] flex-col">
        {palette.map(c => (
          <div key={c.role} className="flex flex-1 items-end p-[1.5cqw]" style={{ background: c.hex }}>
            <span style={{ fontSize: '2.2cqw', color: c.role === 'ink' || c.role === 'primary' ? byRole.background?.hex : byRole.ink?.hex }}>
              {c.name} · {c.hex.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
