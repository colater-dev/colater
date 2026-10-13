import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'Colater: clarify your brand, generate on-brand assets';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
    const png = await readFile(join(process.cwd(), 'public', 'colater.png'));
    const wordmark = `data:image/png;base64,${png.toString('base64')}`;

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 40,
                    background: '#f9f9f9',
                    color: '#171717',
                    fontFamily: 'sans-serif',
                }}
            >
                <img src={wordmark} alt="" width={488} height={200} />
                <div style={{ fontSize: 36, color: '#737373', letterSpacing: -0.5 }}>
                    Clarify your brand. Generate on-brand assets.
                </div>
            </div>
        ),
        size,
    );
}
