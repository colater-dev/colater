import { BRAND_FONTS } from '@/config/brand-fonts';

export function TypographySlide({ name, fontName }: { name: string; fontName?: string }) {
  const font = BRAND_FONTS.find(f => f.name === fontName) ?? BRAND_FONTS.find(f => f.name === 'Archivo')!;
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-[2cqw] px-[8cqw]">
      <span style={{ fontFamily: `var(${font.variable})`, fontSize: '16cqw' }} className="leading-none">Aa</span>
      <span style={{ fontFamily: `var(${font.variable})`, fontSize: '5cqw' }} className="leading-tight">{name}</span>
      <span style={{ fontSize: '2.6cqw' }} className="font-sans text-muted-foreground">{font.name} · Geist Sans</span>
    </div>
  );
}
