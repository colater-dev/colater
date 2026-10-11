'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react';
import { createStickerEffect } from '@/lib/sticker-effect';

export function InUseSlide({ markUrl }: { markUrl: string }) {
  const [sticker, setSticker] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    createStickerEffect(markUrl).then(s => { if (alive) setSticker(s); });
    return () => { alive = false; };
  }, [markUrl]);
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-[8cqw] bg-neutral-100">
      <div className="flex h-[30cqw] w-[30cqw] items-center justify-center rounded-[22%] bg-black">
        <img src={markUrl} alt="" className="h-[60%] w-auto object-contain invert" />
      </div>
      {sticker && <img src={sticker} alt="" className="h-[34cqw] w-auto -rotate-6 object-contain drop-shadow-md" />}
    </div>
  );
}
