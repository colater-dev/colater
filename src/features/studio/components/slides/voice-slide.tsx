import type { PaletteColor } from '../../types';

export function VoiceSlide({ tagline, story, palette }: { tagline: string; story: string; palette?: PaletteColor[] }) {
  const c = Object.fromEntries((palette ?? []).map(p => [p.role, p.hex])) as Partial<Record<PaletteColor['role'], string>>;
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-[3cqw] px-[8cqw]" style={{ background: c.background ?? '#ffffff', color: c.ink ?? '#111111' }}>
      <span style={{ fontSize: '6cqw' }} className="font-semibold leading-tight">{tagline}</span>
      <span style={{ fontSize: '2.8cqw' }} className="opacity-75">{story}</span>
    </div>
  );
}
