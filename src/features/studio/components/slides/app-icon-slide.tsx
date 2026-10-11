'use client';
/* eslint-disable @next/next/no-img-element */
import { useRecoloredMark } from '../../hooks/use-recolored-mark';

export function AppIconSlide({ markUrl, name, color }: { markUrl: string; name: string; color?: string }) {
  const white = useRecoloredMark(markUrl, '#FFFFFF');
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[2cqw] bg-neutral-100">
      <div className="flex h-[28cqw] w-[28cqw] items-center justify-center rounded-[22%] shadow-lg" style={{ background: color ?? '#000000' }}>
        {white && <img src={white} alt="" className="h-[30%] w-auto object-contain" />}
      </div>
      <span style={{ fontSize: '2.6cqw' }} className="text-neutral-700">{name}</span>
    </div>
  );
}
