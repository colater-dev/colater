/** Recolors a black-on-white mark in place: ink where dark, transparent where white. */
export function recolorPixels(data: Uint8ClampedArray, ink: { r: number; g: number; b: number }): void {
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    // Map luminance 245..0 → alpha 0..255 (anything lighter than 245 is paper).
    const alpha = lum >= 245 ? 0 : Math.round(((245 - lum) / 245) * 255);
    data[i] = ink.r;
    data[i + 1] = ink.g;
    data[i + 2] = ink.b;
    data[i + 3] = Math.round((alpha * data[i + 3]) / 255);
  }
}

/** Bounding box of the visible ink (alpha > 30) in RGBA pixels, and how much of that box is filled. */
export function measureInk(data: Uint8ClampedArray, width: number, height: number): { x: number; y: number; width: number; height: number; density: number } | null {
  let minX = width, minY = height, maxX = -1, maxY = -1, ink = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] <= 30) continue;
      ink++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  return { x: minX, y: minY, width: w, height: h, density: ink / (w * h) };
}
