import { memo } from 'react';

interface MockupPreviewProps {
    logoUrl: string | null;
    mockupImage: string;
    brandName: string;
    label: string;
    className?: string;
    invert?: boolean;
}

export const MockupPreview = memo(function MockupPreview({
    logoUrl,
    mockupImage,
    label,
    className,
}: MockupPreviewProps) {
    return (
        <div
            className={`relative aspect-square flex items-center justify-center group overflow-hidden ${className}`}
            style={{
                backgroundImage: `url('${mockupImage}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            {/* 
            We can't easily download the composite image without html-to-image. 
            I'll omit the download button for this specific tile unless I implement the capture logic.
            Given the user just asked to "Add ... as a mockup tile", I'll focus on display first.
            */}

            {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={logoUrl}
                    alt={`${label} logo`}
                    className="object-contain absolute"
                    style={{
                        filter: 'invert(1)',
                        width: '20%',
                        height: '20%',
                        mixBlendMode: 'color-dodge',
                        transform: 'rotate(-8deg)',
                        opacity: 0.5,
                    }}
                />
            ) : (
                <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
            )}
            <p className="absolute bottom-2 left-0 right-0 text-xs text-center text-gray-400">{label}</p>
        </div>
    );
});
