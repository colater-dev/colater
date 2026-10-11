'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react';
import { createStickerEffect } from '@/lib/sticker-effect';

export function StickerSlide({ markUrl }: { markUrl: string }) {
  const [sticker, setSticker] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    createStickerEffect(markUrl).then(s => { if (alive) setSticker(s); });
    return () => { alive = false; };
  }, [markUrl]);
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('/laptop-keyboard-mockup.webp')" }}>
      {sticker && (
        <img src={sticker} alt="Sticker on a laptop" className="h-[30cqw] w-auto -rotate-12 object-contain opacity-90"
          style={{ filter: 'drop-shadow(rgba(0,0,0,0.35) -0.3cqw 0.4cqw 0.2cqw)' }} />
      )}
    </div>
  );
}
