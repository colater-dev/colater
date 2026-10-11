'use client';
/* eslint-disable @next/next/no-img-element */
import { useRecoloredMark } from '../../hooks/use-recolored-mark';
import { variationTiles, type VariationTile } from '../../slide-specs';
import type { PaletteColor } from '../../types';

function Tile({ markUrl, tile }: { markUrl: string; tile: VariationTile }) {
  const mark = useRecoloredMark(markUrl, tile.ink);
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden bg-cover bg-center"
      style={{ background: tile.photo ? undefined : tile.background, backgroundImage: tile.photo ? "linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.35)), url('/laptop-keyboard-mockup.webp')" : undefined }}
    >
      {mark && <img src={mark} alt="" className="h-[45%] w-auto object-contain" />}
      <span className="absolute bottom-[1.2cqw] left-[1.5cqw]" style={{ fontSize: '1.7cqw', color: tile.ink, opacity: 0.8 }}>{tile.label}</span>
    </div>
  );
}

export function VariationsSlide({ markUrl, palette }: { markUrl: string; palette?: PaletteColor[] }) {
  return (
    <div className="absolute inset-0 grid grid-cols-3 grid-rows-2">
      {variationTiles(palette).map(t => <Tile key={t.label} markUrl={markUrl} tile={t} />)}
    </div>
  );
}
