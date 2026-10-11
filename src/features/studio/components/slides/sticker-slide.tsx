'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react';
import { createStickerEffect } from '@/lib/sticker-effect';

/** The sticker on a royalty-free photo of the brand's surface, or on the laptop when there is none. */
export function StickerSlide({ markUrl, backgroundUrl }: { markUrl: string; backgroundUrl?: string }) {
  const [sticker, setSticker] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    createStickerEffect(markUrl).then(s => { if (alive) setSticker(s); });
    return () => { alive = false; };
  }, [markUrl]);
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url('${backgroundUrl ?? '/laptop-keyboard-mockup.webp'}')` }}>
      {sticker && (
        <img src={sticker} alt={backgroundUrl ? 'Sticker in use' : 'Sticker on a laptop'} className="h-[30cqw] w-auto -rotate-12 object-contain opacity-90"
          style={{ filter: 'drop-shadow(rgba(0,0,0,0.35) -0.3cqw 0.4cqw 0.2cqw)' }} />
      )}
    </div>
  );
}
