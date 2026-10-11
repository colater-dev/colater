'use client';

import { useEffect, useState } from 'react';
import { hexToRgb } from '@/lib/color-utils';
import { getProxyUrl } from '@/lib/image-utils';
import { recolorPixels } from '@/lib/recolor';

export function useRecoloredMark(markUrl: string | undefined, hex: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const ink = hex ? hexToRgb(hex) : null;
    if (!markUrl || !ink) return;
    let alive = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      recolorPixels(data.data, ink);
      ctx.putImageData(data, 0, 0);
      if (alive) setUrl(canvas.toDataURL('image/png'));
    };
    img.src = getProxyUrl(markUrl);
    return () => { alive = false; };
  }, [markUrl, hex]);
  return url;
}
