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
