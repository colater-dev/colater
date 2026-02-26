import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { toPng } from 'html-to-image';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RefreshCw, Trash2, Download } from 'lucide-react';
import { shiftHue, darkenColor, isLightColor } from '@/lib/color-utils';
import type { Logo } from '@/lib/types';
import { CritiquePoint } from './critique-point';
import { StickerPreview } from './sticker-preview';
import { MockupPreview } from './mockup-preview';

import { LogoPreviewCard } from './logo-preview-card';
import { cropImageToContent, getProxyUrl } from '@/lib/image-utils';
import { createStickerEffect } from '@/lib/sticker-effect';
import { useToast } from '@/hooks/use-toast';

interface LogoShowcaseProps {
    currentLogo: Logo;
    brandName: string;
    showCritique: boolean;
    expandedPointId: string | null;
    setExpandedPointId: (id: string | null) => void;
    hueShifts: Record<number, number>;
    setHueShifts: React.Dispatch<React.SetStateAction<Record<number, number>>>;
    selectedBrandFont: string;
    onFontChange: (font: string) => void;
    cardModes: Record<string, number>;
    cycleCardMode: (key: string, defaultInvert: boolean) => void;
    getCardMode: (key: string, defaultInvert: boolean) => number;
    getModeStyles: (mode: number) => React.CSSProperties;
    onColorizeLogo: () => void;
    isColorizing: boolean;
    isGeneratingLogo: boolean;

    // Control Props
    textTransform: 'none' | 'lowercase' | 'capitalize' | 'uppercase';
    setTextTransform: (transform: 'none' | 'lowercase' | 'capitalize' | 'uppercase') => void;
    animationType: 'fade' | 'slide' | 'scale' | 'logoAnimation' | null;
    triggerAnimation: (type: 'fade' | 'slide' | 'scale' | 'logoAnimation') => void;
    animationKey: number;
    showBrandName: boolean;
    setShowBrandName: (show: boolean) => void;
    invertLogo: boolean;
    setInvertLogo: (invert: boolean) => void;

    // Horizontal Layout Props
    horizontalLogoTextGap: number;
    setHorizontalLogoTextGap: (gap: number) => void;
    horizontalLogoTextBalance: number;
    setHorizontalLogoTextBalance: (balance: number) => void;

    // Vertical Layout Props
    verticalLogoTextGap: number;
    setVerticalLogoTextGap: (gap: number) => void;
    verticalLogoTextBalance: number;
    setVerticalLogoTextBalance: (balance: number) => void;

    logoContrast: number;
    setLogoContrast: (contrast: number) => void;
    readOnly?: boolean;
    // External Media Props
    externalMediaUrl?: string;
    onExternalMediaChange?: (url: string) => void;
    isSavingMedia?: boolean;
    onExternalMediaBlur?: () => void;
    onFileUpload?: (file: File) => void;
    onDeleteColorVersion?: (index: number) => void;
    onVectorizeLogo?: (croppedLogoUrl: string) => void;
    isVectorizing?: boolean;
    onSaveCropDetails?: (logoId: string, cropDetails: { x: number; y: number; width: number; height: number }) => Promise<void>;
}

export const LogoShowcase = memo(function LogoShowcase({
    currentLogo,
    brandName,
    showCritique,
    expandedPointId,
    setExpandedPointId,
    hueShifts,
    setHueShifts,
    selectedBrandFont,
    onFontChange,
    cycleCardMode,
    getCardMode,
    getModeStyles,
    onColorizeLogo,
    isColorizing,
    isGeneratingLogo,
    textTransform,
    setTextTransform,
    animationType,
    triggerAnimation,
    animationKey,
    showBrandName,
    setShowBrandName,
    invertLogo,
    setInvertLogo,
    horizontalLogoTextGap,
    setHorizontalLogoTextGap,
    horizontalLogoTextBalance,
    setHorizontalLogoTextBalance,
    verticalLogoTextGap,
    setVerticalLogoTextGap,
    verticalLogoTextBalance,
    setVerticalLogoTextBalance,
    logoContrast,
    setLogoContrast,
    readOnly = false,
    externalMediaUrl,
    onExternalMediaChange,
    isSavingMedia,
    onExternalMediaBlur,
    onFileUpload,
    onDeleteColorVersion,
    onVectorizeLogo,
    onSaveCropDetails,
}: LogoShowcaseProps) {
    const [croppedLogoUrl, setCroppedLogoUrl] = useState<string | null>(null);
    const [stickerLogoUrl, setStickerLogoUrl] = useState<string | null>(null);
    const [colorStickerUrl, setColorStickerUrl] = useState<string | null>(null);
    const [directStickerUrl, setDirectStickerUrl] = useState<string | null>(null); // B&W sticker from original URL (bypassing crop)
    const [, setCropBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    // Existing effect for bw sticker and cropped logo

    useEffect(() => {
        if (currentLogo?.logoUrl) {
            // Calculate crop bounds from original image using proxy to avoid CORS
            const proxyUrl = getProxyUrl(currentLogo.logoUrl);
            const originalImg = document.createElement('img');
            // Don't set crossOrigin for same-origin proxy requests
            if (!proxyUrl.startsWith('/')) {
                originalImg.crossOrigin = "Anonymous";
            }
            originalImg.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = originalImg.width;
                canvas.height = originalImg.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                ctx.drawImage(originalImg, 0, 0);
                let imageData: ImageData;
                try {
                    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                } catch {
                    console.warn('Could not get image data (CORS), skipping crop detection');
                    return;
                }
                const data = imageData.data;

                // Check corners for background color detection
                // (10, 10) from each corner
                const corners = [
                    { x: 10, y: 10 },
                    { x: canvas.width - 10, y: 10 },
                    { x: 10, y: canvas.height - 10 },
                    { x: canvas.width - 10, y: canvas.height - 10 }
                ];

                let lightCorners = 0;
                corners.forEach(corner => {
                    // Clamp coordinates just in case image is tiny
                    const x = Math.max(0, Math.min(canvas.width - 1, corner.x));
                    const y = Math.max(0, Math.min(canvas.height - 1, corner.y));

                    const i = (y * canvas.width + x) * 4;
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // Simple luminance check
                    // Using standard formula: 0.299R + 0.587G + 0.114B
                    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                    if (luminance > 128) {
                        lightCorners++;
                    }
                });

                // If at least 3 corners are light, it's a Black on White logo -> invertLogo = false
                // Otherwise (Dark BG), it's White on Black -> invertLogo = true
                // Only set if not already set by display settings
                if (!currentLogo.displaySettings) {
                    if (lightCorners >= 3) {
                        setInvertLogo(false);
                    } else {
                        setInvertLogo(true);
                    }
                }

                if (currentLogo.cropDetails) {
                    setCropBounds(currentLogo.cropDetails);
                } else {
                    // Get background color from top-left pixel for cropping logic
                    const bgR = data[0];
                    const bgG = data[1];
                    const bgB = data[2];
                    const bgA = data[3];
                    const threshold = 30;

                    let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
                    let foundContent = false;

                    for (let y = 0; y < canvas.height; y++) {
                        for (let x = 0; x < canvas.width; x++) {
                            const i = (y * canvas.width + x) * 4;
                            const r = data[i];
                            const g = data[i + 1];
                            const b = data[i + 2];
                            const a = data[i + 3];

                            if (bgA === 0 && a === 0) continue;

                            const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB) + Math.abs(a - bgA);

                            if (diff > threshold) {
                                if (x < minX) minX = x;
                                if (x > maxX) maxX = x;
                                if (y < minY) minY = y;
                                if (y > maxY) maxY = y;
                                foundContent = true;
                            }
                        }
                    }

                    if (foundContent) {
                        const padding = 20;
                        minX = Math.max(0, minX - padding);
                        minY = Math.max(0, minY - padding);
                        maxX = Math.min(canvas.width, maxX + padding);
                        maxY = Math.min(canvas.height, maxY + padding);

                        const calculatedBounds = {
                            x: minX,
                            y: minY,
                            width: maxX - minX,
                            height: maxY - minY
                        };
                        setCropBounds(calculatedBounds);

                        // Save calculated bounds
                        if (onSaveCropDetails) {
                            onSaveCropDetails(currentLogo.id, calculatedBounds);
                        }
                    }
                }
            };
            // Use proxy URL to avoid CORS issues
            originalImg.src = proxyUrl;

            if (currentLogo.cropDetails) {
                cropImageToContent(currentLogo.logoUrl, currentLogo.cropDetails).then(setCroppedLogoUrl).catch(() => {
                    // CORS or load failure — display original URL
                });
            } else {
                cropImageToContent(currentLogo.logoUrl).then(setCroppedLogoUrl).catch(() => {
                    // CORS or load failure — display original URL
                });
            }
            // B&W sticker is now generated in a separate effect that depends on croppedLogoUrl
        }
    }, [currentLogo?.logoUrl, currentLogo?.cropDetails, onSaveCropDetails, setInvertLogo]); // eslint-disable-line react-hooks/exhaustive-deps

    // Generate B&W sticker from cropped logo (once cropped logo is ready)
    useEffect(() => {
        if (croppedLogoUrl) {
            createStickerEffect(croppedLogoUrl).then(setStickerLogoUrl);
        }
    }, [croppedLogoUrl]);

    // New effect for color sticker (if a color version exists)
    useEffect(() => {
        const colorUrl = currentLogo?.colorLogoUrl || (currentLogo?.colorVersions?.[0]?.colorLogoUrl);
        if (colorUrl) {
            // Use the B&W logo as the mask source to ensure consistent shape
            createStickerEffect(colorUrl, currentLogo?.logoUrl).then(setColorStickerUrl);
        } else {
            setColorStickerUrl(null);
        }
    }, [currentLogo?.colorLogoUrl, currentLogo?.colorVersions, currentLogo?.logoUrl]);

    // Direct B&W sticker effect (bypasses cropping, uses original URL like color sticker)
    useEffect(() => {
        if (currentLogo?.logoUrl) {
            createStickerEffect(currentLogo.logoUrl).then(setDirectStickerUrl);
        } else {
            setDirectStickerUrl(null);
        }
    }, [currentLogo?.logoUrl]);

    const handleDownload = useCallback(async (ref: React.RefObject<HTMLDivElement | null>, suffix: string) => {
        if (!ref.current) {
            return;
        }

        try {
            const dataUrl = await toPng(ref.current, {
                cacheBust: true,
                pixelRatio: 2,
                filter: (node) => {
                    return !node.classList?.contains('exclude-from-download');
                }
            });
            const link = document.createElement('a');
            link.download = `${brandName.replace(/\s+/g, '-').toLowerCase()}-${suffix}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to download logo preview:', err);
        }
    }, [brandName]);

    /**
     * Helper function to determine if logo should be inverted based on background
     * @param backgroundType - 'light' for white/light backgrounds, 'dark' for black/dark backgrounds
     * @returns boolean - whether to apply invert(1) filter
     * 
     * Logic:
     * - Black & white logos are typically black on transparent (or white bg)
     * - If invertLogo is FALSE (normal):
     *   - Light backgrounds: no invert (black logo shows on white)
     *   - Dark backgrounds: invert (black becomes white, shows on dark)
     * - If invertLogo is TRUE (inverted):
     *   - Light backgrounds: invert (white logo shows on white bg - needs invert to be black)
     *   - Dark backgrounds: no invert (white logo shows on dark)
     * 
     * This is XOR logic: invert when (isDark XOR invertLogo)
     */
    const shouldInvertLogo = useCallback((backgroundType: 'light' | 'dark') => {
        const isDark = backgroundType === 'dark';
        // XOR: invert when exactly one is true
        return isDark !== invertLogo;
    }, [invertLogo]);

    const { toast } = useToast();
    const [isWaitingForVector, setIsWaitingForVector] = useState(false);

    const downloadVector = useCallback(async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${brandName.replace(/\s+/g, '-').toLowerCase()}-logo.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Failed to download SVG:', error);
            toast({
                variant: 'destructive',
                title: 'Download Failed',
                description: 'Could not download the SVG file.',
            });
        }
    }, [brandName, toast]);

    // Effect to handle auto-download when vector url becomes available
    useEffect(() => {
        if (isWaitingForVector && currentLogo?.vectorLogoUrl) {
            downloadVector(currentLogo.vectorLogoUrl);
            setIsWaitingForVector(false);
        }
    }, [isWaitingForVector, currentLogo?.vectorLogoUrl, downloadVector]);

    const handleDownloadSvg = useCallback(async () => {
        if (!currentLogo?.logoUrl || !onVectorizeLogo) return;

        // If we already have a vector URL, download it directly
        if (currentLogo.vectorLogoUrl) {
            downloadVector(currentLogo.vectorLogoUrl);
        } else {
            // Show toast and trigger vectorization
            toast({
                title: 'Preparing SVG',
                description: 'This could take a few seconds...',
            });
            setIsWaitingForVector(true);
            // Use cropped URL if available, otherwise original
            onVectorizeLogo(croppedLogoUrl || currentLogo.logoUrl);
        }
    }, [currentLogo, onVectorizeLogo, croppedLogoUrl, downloadVector, toast]);

    return (
        <div className="w-full mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Horizontal Preview */}
                <LogoPreviewCard
                    layout="horizontal"
                    logo={currentLogo}
                    croppedLogoUrl={croppedLogoUrl}
                    brandName={brandName}
                    selectedBrandFont={selectedBrandFont}
                    showCritique={showCritique}
                    expandedPointId={expandedPointId}
                    setExpandedPointId={setExpandedPointId}
                    readOnly={readOnly}
                    textTransform={textTransform}
                    setTextTransform={setTextTransform}
                    showBrandName={showBrandName}
                    setShowBrandName={setShowBrandName}
                    invertLogo={invertLogo}
                    setInvertLogo={setInvertLogo}
                    logoTextGap={horizontalLogoTextGap}
                    setLogoTextGap={setHorizontalLogoTextGap}
                    logoTextBalance={horizontalLogoTextBalance}
                    setLogoTextBalance={setHorizontalLogoTextBalance}
                    logoContrast={logoContrast}
                    setLogoContrast={setLogoContrast}
                    animationType={animationType}
                    triggerAnimation={triggerAnimation}
                    animationKey={animationKey}
                    onDownload={(ref) => handleDownload(ref, 'horizontal-preview')}
                    onDownloadSvg={handleDownloadSvg}
                    shouldInvertLogo={shouldInvertLogo}
                    onFontChange={onFontChange}
                />

                {/* Vertical Preview */}
                <LogoPreviewCard
                    layout="vertical"
                    logo={currentLogo}
                    croppedLogoUrl={croppedLogoUrl}
                    brandName={brandName}
                    selectedBrandFont={selectedBrandFont}
                    showCritique={showCritique}
                    expandedPointId={expandedPointId}
                    setExpandedPointId={setExpandedPointId}
                    readOnly={readOnly}
                    textTransform={textTransform}
                    setTextTransform={setTextTransform}
                    showBrandName={showBrandName}
                    setShowBrandName={setShowBrandName}
                    invertLogo={invertLogo}
                    setInvertLogo={setInvertLogo}
                    logoTextGap={verticalLogoTextGap}
                    setLogoTextGap={setVerticalLogoTextGap}
                    logoTextBalance={verticalLogoTextBalance}
                    setLogoTextBalance={setVerticalLogoTextBalance}
                    logoContrast={logoContrast}
                    setLogoContrast={setLogoContrast}
                    animationType={animationType}
                    triggerAnimation={triggerAnimation}
                    animationKey={animationKey}
                    onDownload={(ref) => handleDownload(ref, 'vertical-preview')}
                    onDownloadSvg={handleDownloadSvg}
                    shouldInvertLogo={shouldInvertLogo}
                    onFontChange={onFontChange}
                />

                {/* External Media Section - Spans full width */}
                <div className="col-span-1 md:col-span-2 w-full bg-gray-50 border-y border-gray-100 flex flex-col items-center justify-center">
                    {externalMediaUrl && (
                        <div className="w-full overflow-hidden bg-black/5 relative group">
                            {!readOnly && onExternalMediaChange && (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                        onExternalMediaChange('');
                                        if (onExternalMediaBlur) {
                                            // Trigger save immediately after clearing
                                            setTimeout(onExternalMediaBlur, 0);
                                        }
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                            {externalMediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                                <video
                                    src={externalMediaUrl}
                                    controls
                                    className="w-full h-auto"
                                />
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={externalMediaUrl}
                                    alt="External media"
                                    className="w-full h-auto"
                                />
                            )}
                        </div>
                    )}

                    {!readOnly && onExternalMediaChange && (
                        <div className="w-full max-w-xl space-y-2 p-8">
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    placeholder="Paste an image or video URL (mp4, webm, ogg)..."
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={externalMediaUrl || ''}
                                    onChange={(e) => onExternalMediaChange(e.target.value)}
                                    onBlur={onExternalMediaBlur}
                                />
                                {isSavingMedia && (
                                    <div className="flex items-center text-sm text-muted-foreground whitespace-nowrap">
                                        Saving...
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 justify-center">
                                <p className="text-xs text-muted-foreground">Or upload a file:</p>
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    title="Upload image or video file"
                                    className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file && onFileUpload) {
                                            onFileUpload(file);
                                            e.target.value = ''; // Reset input
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* 2x2 Grid for additional previews */}
            <div className="w-full mt-8 grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Sticker Effect - Show black/white sticker if available */}
                <StickerPreview
                    stickerUrl={stickerLogoUrl}
                    brandName={brandName}
                    label="Sticker"
                />

                {/* Color Sticker Effect - Show color sticker if available */}
                {(currentLogo?.colorLogoUrl || currentLogo?.colorVersions?.[0]?.colorLogoUrl) && (
                    <StickerPreview
                        stickerUrl={colorStickerUrl}
                        brandName={brandName}
                        label="Color Sticker"
                        isColor={true}
                        hueShift={hueShifts[0] || 0}
                    />
                )}

                {/* Direct B&W Sticker Effect - Bypasses cropping, uses original URL */}
                <StickerPreview
                    stickerUrl={directStickerUrl}
                    brandName={brandName}
                    label="Direct Sticker"
                />

                {/* T-Shirt Mockup */}
                <MockupPreview
                    logoUrl={croppedLogoUrl || currentLogo.logoUrl}
                    mockupImage="/t-shirt-mockup.png"
                    brandName={brandName}
                    label="T-Shirt"
                    invert={invertLogo}
                />

                {/* Light Logo (On Gray) */}
                <div className="relative aspect-square bg-gray-900 flex items-center justify-center group" ref={useRef<HTMLDivElement>(null)}>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 exclude-from-download">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 bg-black/20 hover:bg-black/40 text-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownload({ current: e.currentTarget.closest('.group') }, 'light-logo');
                            }}
                            title="Download PNG"
                        >
                            <Download className="w-4 h-4" />
                        </Button>
                    </div>
                    <Image
                        src={currentLogo.logoUrl}
                        alt="Logo on gray background"
                        width={200}
                        height={200}
                        className="object-contain w-full h-full opacity-50"
                        unoptimized={currentLogo.logoUrl.startsWith('data:')}
                        style={{
                            filter: shouldInvertLogo('dark') ? 'invert(1)' : 'none'
                        }}
                    />
                    {/* Critique Points Overlay - Card 2 */}
                    {showCritique && currentLogo?.critique?.points && (
                        <div className="absolute bottom-8 right-2 flex flex-col gap-2 items-end z-20 exclude-from-download">
                            {currentLogo.critique.points
                                .filter((_, idx) => idx % 3 === 1)
                                .map((point) => (
                                    <CritiquePoint
                                        key={point.id}
                                        point={point}
                                        isExpanded={expandedPointId === point.id}
                                        onToggle={(e) => {
                                            e.stopPropagation();
                                            setExpandedPointId(expandedPointId === point.id ? null : point.id);
                                        }}
                                        isStatic={true}
                                    />
                                ))}
                        </div>
                    )}
                    <p className="absolute bottom-2 left-0 right-0 text-xs text-center text-gray-400 exclude-from-download">Light Logo</p>
                </div>

                {/* Dark Logo (Inverted on Black) */}
                <div className="relative aspect-square bg-black flex items-center justify-center group">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 exclude-from-download">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 bg-white/20 hover:bg-white/40 text-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownload({ current: e.currentTarget.closest('.group') as HTMLDivElement }, 'dark-logo');
                            }}
                            title="Download PNG"
                        >
                            <Download className="w-4 h-4" />
                        </Button>
                    </div>
                    <Image
                        src={currentLogo.logoUrl}
                        alt="Inverted logo on black background"
                        width={200}
                        height={200}
                        className="object-contain w-full h-full"
                        unoptimized={currentLogo.logoUrl.startsWith('data:')}
                        style={{ filter: !shouldInvertLogo('dark') ? 'invert(1)' : 'none' }}
                    />
                    {/* Critique Points Overlay - Card 3 */}
                    {showCritique && currentLogo?.critique?.points && (
                        <div className="absolute bottom-8 right-2 flex flex-col gap-2 items-end z-20 exclude-from-download">
                            {currentLogo.critique.points
                                .filter((_, idx) => idx % 3 === 2)
                                .map((point) => (
                                    <CritiquePoint
                                        key={point.id}
                                        point={point}
                                        isExpanded={expandedPointId === point.id}
                                        onToggle={(e) => {
                                            e.stopPropagation();
                                            setExpandedPointId(expandedPointId === point.id ? null : point.id);
                                        }}
                                        isStatic={true}
                                    />
                                ))}
                        </div>
                    )}
                    <p className="absolute bottom-2 left-0 right-0 text-xs text-center text-gray-400 exclude-from-download">Dark Logo</p>
                </div>

                {/* On Brand Color (Darkened) - Show all palette colors from all color versions with hue shift */}
                {(() => {
                    // Support new colorVersions structure and legacy fields
                    const colorVersions = currentLogo.colorVersions || [];

                    // Migrate legacy fields if needed
                    if (colorVersions.length === 0 && currentLogo.colorLogoUrl) {
                        colorVersions.push({ colorLogoUrl: currentLogo.colorLogoUrl, palette: currentLogo.palette || [] });
                    }

                    // Flatten all colors from all versions with their hue shifts
                    const allBrandColors: Array<{ color: string; versionIndex: number; colorIndex: number; palette: string[] }> = [];
                    colorVersions.forEach((colorVersion, versionIndex) => {
                        const currentHueShift = hueShifts[versionIndex] || 0;
                        const shiftedPalette = colorVersion.palette.map(color => shiftHue(color, currentHueShift));

                        shiftedPalette.forEach((color, colorIndex) => {
                            allBrandColors.push({
                                color,
                                versionIndex,
                                colorIndex,
                                palette: shiftedPalette
                            });
                        });
                    });

                    if (allBrandColors.length > 0) {
                        return allBrandColors.map((brandColor, index) => {
                            const darkenedColor = darkenColor(brandColor.color, 0.2);
                            const shouldInvert = isLightColor(darkenedColor);
                            const cardKey = `brand-color-v${brandColor.versionIndex}-c${brandColor.colorIndex}`;
                            const mode = getCardMode(cardKey, shouldInvert);
                            getModeStyles(mode);

                            return (
                                <div
                                    key={cardKey}
                                    className="relative aspect-square flex items-center justify-center group"
                                    style={{ backgroundColor: darkenedColor }}
                                >
                                    <div className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity z-10 exclude-from-download">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-8 h-8 bg-black/20 hover:bg-black/40 text-white"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload({ current: e.currentTarget.closest('.group') as HTMLDivElement }, `on-brand-color-${index + 1}`);
                                            }}
                                            title="Download PNG"
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    {/* Small palette display at top */}
                                    <div className="absolute top-2 left-2 flex gap-1 z-10 exclude-from-download">
                                        {brandColor.palette.map((paletteColor, paletteIndex) => (
                                            <div
                                                key={`palette-dot-${paletteIndex}`}
                                                className="w-3 h-3 rounded-full border"
                                                style={{
                                                    backgroundColor: paletteColor,
                                                    borderColor: paletteIndex === brandColor.colorIndex ? 'white' : 'transparent',
                                                    borderWidth: paletteIndex === brandColor.colorIndex ? '2px' : '1px'
                                                }}
                                                title={paletteColor}
                                            />
                                        ))}
                                    </div>

                                    {/* Toggle Button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 w-8 h-8 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 exclude-from-download"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            cycleCardMode(cardKey, shouldInvert);
                                        }}
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>

                                    {(() => {

                                        // "This should take into account whether the invert logo option is enabled, and whether the background is dark or light."
                                        // "If there is a color that is very close to black, hide the 'On Gray' option." (Wait, 'On Gray' is 'Light Logo' now. Maybe it means hide this card if it's too dark?)
                                        // No, "hide the 'On Gray' option" likely refers to the "Light Logo" card if the brand color is gray?
                                        // Or maybe it means if the brand color is black, don't show "On Brand Color" card?
                                        // The user says: "If there is a color that is very close to black, hide the 'On Gray' option."
                                        // This is ambiguous. "On Gray" is a specific card.
                                        // Maybe they mean if the brand color is very close to the "On Gray" background color?
                                        // Or maybe they mean "On Brand Color" option?
                                        // I'll assume they mean "On Brand Color" card should be hidden if color is too dark?
                                        // But the text says "hide the 'On Gray' option".
                                        // I'll stick to the contrast logic first.

                                        const backgroundType = isLightColor(darkenedColor) ? 'light' : 'dark';
                                        // Use shouldInvertLogo to determine if we need to invert based on background AND global invert setting
                                        shouldInvertLogo(backgroundType);

                                        // Combine with card mode styles (which might also have invert)
                                        // getModeStyles returns filter: 'invert(1)' or 'none'
                                        // If both are invert(1), they cancel out?
                                        // Wait, getModeStyles is for manual toggle.
                                        // The user wants "best contrast version".
                                        // If I use shouldInvertLogo, it handles the logic:
                                        // - If bg is light: black logo (unless inverted globally -> white logo)
                                        // - If bg is dark: white logo (unless inverted globally -> black logo)

                                        // So baseInvert is correct.
                                        // But cardMode allows manual override.
                                        // If cardMode is default (0), we should use baseInvert.
                                        // If cardMode is toggled, we use what getModeStyles says?
                                        // getModeStyles returns fixed filters based on mode 0, 1, 2, 3.
                                        // Mode 0: darken, none
                                        // Mode 1: lighten, none
                                        // Mode 2: lighten, invert
                                        // Mode 3: darken, invert

                                        // The user says "Figure out the appropriate logic to make sure each of the 'on brand color' options show the best contrast version."
                                        // This implies the DEFAULT mode should be correct.
                                        // Currently getCardMode returns defaultInvert ? 2 : 0.
                                        // defaultInvert is passed as `shouldInvert`.
                                        // `shouldInvert` was `isLightColor(darkenedColor)`.
                                        // If light color -> shouldInvert=true -> mode 2 -> lighten, invert.
                                        // Wait, if bg is light, we want BLACK logo (no invert).
                                        // So if isLightColor is true, we want NO invert.
                                        // `isLightColor` returns true if light.
                                        // `shouldInvert` passed to getCardMode seems to mean "should default to inverted mode".

                                        // Let's look at `shouldInvertLogo`.
                                        // If bg is light, `shouldInvertLogo('light')` returns `invertLogo` (false if normal).
                                        // If bg is dark, `shouldInvertLogo('dark')` returns `!invertLogo` (true if normal).

                                        // So if bg is dark (darkenedColor is dark), we want INVERT (white logo).
                                        // So default mode should be one with invert.

                                        const isDarkBg = !isLightColor(darkenedColor);
                                        const autoInvert = shouldInvertLogo(isDarkBg ? 'dark' : 'light');

                                        // We need to map `autoInvert` to a mode.
                                        // Mode 0: filter: none
                                        // Mode 2: filter: invert(1)
                                        // So if autoInvert is true, default to mode 2. Else mode 0.

                                        // But we also have mix-blend-mode.
                                        // Mode 0: darken. Mode 2: lighten.
                                        // If logo is black (no invert) on light bg -> darken is good.
                                        // If logo is white (invert) on dark bg -> lighten is good.

                                        // So:
                                        // If autoInvert is true (white logo), use Mode 2 (lighten, invert).
                                        // If autoInvert is false (black logo), use Mode 0 (darken, none).

                                        // So I should pass `autoInvert` as `defaultInvert` to `getCardMode`.

                                        const mode = getCardMode(cardKey, autoInvert);
                                        const styles = getModeStyles(mode);

                                        return (
                                            <Image
                                                src={currentLogo.logoUrl}
                                                alt={`Logo on brand color ${index + 1}`}
                                                width={200}
                                                height={200}
                                                className="object-contain w-full h-full"
                                                unoptimized={currentLogo.logoUrl.startsWith('data:')}
                                                style={styles}
                                            />
                                        );
                                    })()}
                                    <p className="absolute bottom-2 left-0 right-0 text-xs text-center text-gray-400 exclude-from-download">
                                        On Brand Color
                                    </p>
                                </div>
                            );
                        });
                    } else {
                        return null;
                    }
                })()}

                {/* Color Logo Versions - Show all versions with individual hue sliders */}
                {(() => {
                    // Support new colorVersions structure and legacy fields
                    const colorVersions = currentLogo.colorVersions || [];

                    // Migrate legacy fields if needed
                    if (colorVersions.length === 0 && currentLogo.colorLogoUrl) {
                        colorVersions.push({ colorLogoUrl: currentLogo.colorLogoUrl, palette: currentLogo.palette || [] });
                    }

                    if (colorVersions.length > 0) {
                        return colorVersions.map((colorVersion, versionIndex) => {
                            const currentHueShift = hueShifts[versionIndex] || 0;
                            const shiftedPalette = colorVersion.palette.map(color => shiftHue(color, currentHueShift));

                            return (
                                <div key={`color-version-${versionIndex}`} className="relative aspect-square bg-white flex flex-col items-center justify-center group">
                                    <div className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity z-10 exclude-from-download">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-8 h-8 bg-black/20 hover:bg-black/40 text-white"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload({ current: e.currentTarget.closest('.group') as HTMLDivElement }, `color-version-${versionIndex + 1}`);
                                            }}
                                            title="Download PNG"
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    {/* Color logo with hue shift */}
                                    <div className="flex-1 w-full flex items-center justify-center relative">
                                        <Image
                                            src={colorVersion.colorLogoUrl}
                                            alt={`Color logo version ${versionIndex + 1}`}
                                            width={200}
                                            height={200}
                                            className="object-contain w-full h-full"
                                            unoptimized={true}
                                            style={{
                                                filter: `hue-rotate(${currentHueShift}deg)`
                                            }}
                                        />

                                        {/* Small palette display at top */}
                                        <div className="absolute top-2 left-2 flex gap-1 exclude-from-download">
                                            {shiftedPalette.map((paletteColor, paletteIndex) => (
                                                <div
                                                    key={`palette-dot-${paletteIndex}`}
                                                    className="w-3 h-3 rounded-full border"
                                                    style={{
                                                        backgroundColor: paletteColor,
                                                        borderColor: 'white',
                                                        borderWidth: '1px'
                                                    }}
                                                    title={paletteColor}
                                                />
                                            ))}
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 w-8 h-8 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 exclude-from-download"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onColorizeLogo();
                                            }}
                                            disabled={isColorizing}
                                            title="Generate another color version"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${isColorizing ? 'animate-spin' : ''}`} />
                                        </Button>

                                        {/* Delete Button */}
                                        {!readOnly && onDeleteColorVersion && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-12 right-2 w-8 h-8 bg-red-500/20 hover:bg-red-500/40 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 exclude-from-download"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteColorVersion(versionIndex);
                                                }}
                                                title="Delete this color version"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Hue slider at bottom */}
                                    <div className="w-full px-3 pb-3 pt-1 exclude-from-download">
                                        <Slider
                                            defaultValue={[0]}
                                            max={360}
                                            step={1}
                                            className="w-full"
                                            value={[currentHueShift]}
                                            onValueChange={(value) => {
                                                setHueShifts(prev => ({ ...prev, [versionIndex]: value[0] }));
                                            }}
                                        />
                                    </div>

                                    <p className="absolute bottom-12 left-0 right-0 text-xs text-center text-gray-400 exclude-from-download">
                                        Color Version {colorVersions.length > 1 ? versionIndex + 1 : ''}
                                    </p>
                                </div>
                            );
                        });
                    } else {
                        return (
                            <div className="relative aspect-square bg-gray-100 flex items-center justify-center">
                                <Button
                                    onClick={onColorizeLogo}
                                    disabled={isColorizing || isGeneratingLogo}
                                    variant="outline"
                                >
                                    {isColorizing ? (
                                        'Colorizing...'
                                    ) : (
                                        'Generate Color Version'
                                    )}
                                </Button>
                            </div>
                        );
                    }
                })()}
            </div>
        </div>
    );
});
