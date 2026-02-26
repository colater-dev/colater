import { memo } from 'react';
import { DownloadButton } from './download-button';

interface StickerPreviewProps {
    stickerUrl: string | null;
    brandName: string;
    label: string;
    isColor?: boolean;
    hueShift?: number;
}

export const StickerPreview = memo(function StickerPreview({ stickerUrl, brandName, label, isColor = false, hueShift = 0 }: StickerPreviewProps) {
    const handleDownload = () => {
        if (!stickerUrl) return;
        const link = document.createElement('a');
        const filename = isColor ? 'color-sticker' : 'sticker';
        link.download = `${brandName.replace(/\s+/g, '-').toLowerCase()}-${filename}.png`;
        link.href = stickerUrl;
        link.click();
    };

    return (
        <div
            className="relative aspect-square flex items-center justify-center group"
            style={{
                backgroundImage: "url('/laptop-keyboard-mockup.webp')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            {stickerUrl && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <DownloadButton onClick={handleDownload} />
                </div>
            )}
            {stickerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={stickerUrl}
                    alt={`${label} logo`}
                    className="object-contain"
                    style={{
                        maxWidth: isColor ? '50%' : '45%',
                        maxHeight: isColor ? '50%' : '45%',
                        filter: `${isColor
                            ? 'drop-shadow(1px 0 0 white) drop-shadow(-1px 0 0 white) drop-shadow(0 1px 0 white) drop-shadow(0 -1px 0 white) drop-shadow(rgba(0, 0, 0, 0.3) -1.5px 2px .5px)'
                            : 'drop-shadow(rgba(0, 0, 0, 0.3) -1.5px 2px .5px)'
                            } hue-rotate(${hueShift}deg)`,
                        transform: `rotate(${isColor ? '15' : '-12'}deg)`,
                        opacity: 0.8
                    }}
                />
            ) : (
                <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
            )}
            <p className="absolute bottom-2 left-0 right-0 text-xs text-center text-gray-400">{label}</p>
        </div>
    );
});
