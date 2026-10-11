import sharp from 'sharp';

const BLACK_POINT = 60;
const WHITE_POINT = 200;

/** Levels for a greyscale value: near-black → 0, near-white → 255, edge tones stretched in between. */
export function levels(v: number): number {
  if (v <= BLACK_POINT) return 0;
  if (v >= WHITE_POINT) return 255;
  return Math.round(((v - BLACK_POINT) / (WHITE_POINT - BLACK_POINT)) * 255);
}

/**
 * Whitens a picture frame some models draw around the mark: a dark line within the outer 4% that
 * runs along most of every one of the four edges. A mark touching one or two edges is left alone.
 */
export function removeFrame(data: Uint8Array, width: number, height: number): void {
  const depth = Math.max(2, Math.round(Math.min(width, height) * 0.04));
  const dark = (x: number, y: number) => data[y * width + x] < 128;
  const rowDark = (y: number) => { let n = 0; for (let x = 0; x < width; x++) if (dark(x, y)) n++; return n / width; };
  const colDark = (x: number) => { let n = 0; for (let y = 0; y < height; y++) if (dark(x, y)) n++; return n / height; };
  const find = (test: (i: number) => number, from: number, step: number) => {
    for (let k = 0; k < depth; k++) if (test(from + k * step) > 0.7) return k;
    return -1;
  };
  const edges = [find(rowDark, 0, 1), find(rowDark, height - 1, -1), find(colDark, 0, 1), find(colDark, width - 1, -1)];
  if (edges.some(e => e < 0)) return;
  const m = Math.min(depth, Math.max(...edges) + 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y < m || y >= height - m || x < m || x >= width - m) data[y * width + x] = 255;
    }
  }
}

/** Normalises a rendered mark to crisp pure black on white (frames removed) as a PNG. */
export async function cleanMark(buffer: Buffer): Promise<{ buffer: Buffer; contentType: string }> {
  const { data, info } = await sharp(buffer).flatten({ background: '#ffffff' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const px = new Uint8Array(data.buffer, data.byteOffset, data.length);
  for (let i = 0; i < px.length; i++) px[i] = levels(px[i]);
  removeFrame(px, info.width, info.height);
  const out = await sharp(Buffer.from(px), { raw: { width: info.width, height: info.height, channels: 1 } }).png().toBuffer();
  return { buffer: out, contentType: 'image/png' };
}
