/* eslint-disable @next/next/no-img-element */
import { BRAND_FONTS } from '@/config/brand-fonts';

export function LockupSlide({ markUrl, name, fontName }: { markUrl: string; name: string; fontName?: string }) {
  const font = BRAND_FONTS.find(f => f.name === fontName) ?? BRAND_FONTS.find(f => f.name === 'Archivo')!;
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-[4cqw] px-[8cqw]">
      <img src={markUrl} alt="" className="h-[28cqw] w-auto object-contain" />
      <span style={{ fontFamily: `var(${font.variable})`, fontSize: `${9 * font.sizeMultiplier}cqw` }} className="leading-none">
        {name}
      </span>
    </div>
  );
}
