'use client';
/* eslint-disable @next/next/no-img-element */
import { useRecoloredMark } from '../../hooks/use-recolored-mark';
import type { PaletteColor } from '../../types';

export function SocialSlide({ markUrl, palette, name, tagline }: { markUrl: string; palette: PaletteColor[]; name: string; tagline?: string }) {
  const c = Object.fromEntries(palette.map(p => [p.role, p.hex])) as Record<PaletteColor['role'], string>;
  const onPrimary = useRecoloredMark(markUrl, c.background);
  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: c.background }}>
      <div className="h-[22cqw]" style={{ background: c.secondary }} />
      <div className="-mt-[8cqw] flex items-end gap-[2cqw] px-[5cqw]">
        <div className="flex h-[16cqw] w-[16cqw] items-center justify-center rounded-full border-[0.8cqw]" style={{ background: c.primary, borderColor: c.background }}>
          {onPrimary && <img src={onPrimary} alt="" className="h-[9cqw] w-auto" />}
        </div>
        <div className="pb-[1cqw]">
          <div style={{ fontSize: '3.4cqw', color: c.ink }} className="font-semibold">{name}</div>
          <div style={{ fontSize: '2.4cqw', color: c.ink }} className="opacity-70">@{name.toLowerCase().replace(/[^a-z0-9]/g, '')}</div>
        </div>
      </div>
      {tagline && <p style={{ fontSize: '2.8cqw', color: c.ink }} className="px-[5cqw] pt-[2cqw]">{tagline}</p>}
    </div>
  );
}
