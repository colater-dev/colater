import { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import { Wifi, Battery, Signal } from 'lucide-react';
import { isLightColor } from '@/lib/color-utils';
import { cropImageToContent } from '@/lib/image-utils';

interface BrandApplicationsProps {
    logoUrl: string;
    brandName: string;
    tagline: string;
    primaryColor: string;
    fontVariable?: string;
    palette?: string[];
    logoScale?: number;
    contrast?: number;
    invert?: boolean;
}

export const BrandApplications = memo(function BrandApplications({
    logoUrl,
    brandName,
    tagline,
    primaryColor,
    fontVariable = 'sans-serif',
    palette = [],
    logoScale = 1,
    contrast = 1.2,
    invert = false,
}: BrandApplicationsProps) {
    const [croppedLogoUrl, setCroppedLogoUrl] = useState<string | null>(null);
    const [rotationFront, setRotationFront] = useState(0);
    const [rotationBack, setRotationBack] = useState(0);

    useEffect(() => {
        if (logoUrl) {
            cropImageToContent(logoUrl).then(setCroppedLogoUrl).catch(() => {
                // CORS or load failure — display original URL
            });
        }
        // Random rotation between 2 and 12 degrees (positive or negative)
        setRotationFront((Math.random() * 10 + 2) * (Math.random() > 0.5 ? 1 : -1)); // eslint-disable-line react-hooks/set-state-in-effect
        setRotationBack((Math.random() * 10 + 2) * (Math.random() > 0.5 ? 1 : -1));
    }, [logoUrl]);

    // Determine background style (gradient or solid)
    const hasGradient = palette.length >= 2;
    const backgroundStyle = hasGradient
        ? { background: `linear-gradient(135deg, ${palette[palette.length - 1]} 0%, ${palette[palette.length - 2]} 100%)` }
        : { backgroundColor: primaryColor };

    // Determine logo blend mode/filter based on background brightness
    // Using the first color of the gradient (or primary color) as a proxy for brightness
    const bgForContrast = hasGradient ? palette[palette.length - 1] : primaryColor;
    const isBgLight = isLightColor(bgForContrast);

    // Determine if logo should be inverted on business card back
    const shouldInvertOnCardBack = invert && isBgLight ? true : (!invert && !isBgLight);

    const logoStyle = {
        filter: isBgLight
            ? `contrast(${contrast})${shouldInvertOnCardBack ? ' invert(1)' : ''}`
            : `contrast(${contrast})${shouldInvertOnCardBack ? ' invert(1)' : ''}`,
        mixBlendMode: isBgLight ? 'multiply' as const : 'screen' as const,
        transform: `scale(${logoScale})`,
        transition: 'transform 0.2s ease-out'
    };

    return (
        <div className="w-full mt-12 mb-12">
            <h3 className="text-lg font-semibold mb-6 text-left px-4">Brand Applications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 w-full">

                {/* 1. Business Cards (Combined) */}
                <div className="flex flex-col md:col-span-2">
                    <div className="relative w-full aspect-square md:aspect-[2/1] bg-gray-50 flex items-center justify-center p-0 border border-gray-100 overflow-hidden">
                        <div className="relative w-full h-full flex items-center justify-center">

                            {/* Back Card (Behind) */}
                            <div
                                className="absolute w-[70%] md:w-[45%] aspect-[3.5/2] shadow-xl flex items-center justify-center p-6 z-0"
                                style={{
                                    ...backgroundStyle,
                                    transform: `translate(15%, 10%) rotate(${rotationBack}deg)`,
                                    transition: 'transform 0.5s ease-out'
                                }}
                            >
                                <div className="w-24 h-24 relative">
                                    <Image
                                        src={croppedLogoUrl || logoUrl}
                                        alt="Logo"
                                        fill
                                        className="object-contain"
                                        style={{
                                            ...logoStyle,
                                            transform: `scale(${logoScale * 1.2})`, // 20% larger
                                        }}
                                        unoptimized={(croppedLogoUrl || logoUrl).startsWith('data:')}
                                    />
                                </div>
                            </div>

                            {/* Front Card (Front) */}
                            <div
                                className="absolute w-[70%] md:w-[45%] aspect-[3.5/2] shadow-xl bg-white p-8 flex flex-row justify-between z-10"
                                style={{
                                    transform: `translate(-15%, -10%) rotate(${rotationFront}deg)`,
                                    transition: 'transform 0.5s ease-out'
                                }}
                            >
                                <div className="w-16 h-16 relative">
                                    <Image
                                        src={croppedLogoUrl || logoUrl}
                                        alt="Logo"
                                        fill
                                        className="object-contain object-left-top"
                                        style={{
                                            transform: `scale(${logoScale * 0.8})`, // 20% smaller
                                            filter: `contrast(${contrast}) ${invert ? 'invert(1)' : ''}`,
                                            transition: 'transform 0.2s ease-out'
                                        }}
                                        unoptimized={(croppedLogoUrl || logoUrl).startsWith('data:')}
                                    />
                                </div>
                                <div className="text-left self-end">
                                    <p className="font-bold text-gray-900 text-sm" style={{ fontFamily: `var(${fontVariable})` }}>John Doe</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Founder</p>
                                    <p className="text-xs text-gray-400 mt-4">john@{brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com</p>
                                </div>
                            </div>

                        </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-2">Business Cards</p>
                </div>

                {/* 3. App Icon (Digital/Small Scale) */}
                <div className="flex flex-col">
                    <div className="relative w-full aspect-square bg-gray-100/50 flex items-center justify-center overflow-hidden backdrop-blur-sm border border-gray-100">
                        {/* Phone Wallpaper Effect */}
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{
                                background: `linear-gradient(135deg, ${primaryColor} 0%, #ffffff 100%)`
                            }}
                        />

                        {/* App Icon */}
                        <div
                            className="w-1/2 aspect-square rounded-[22%] shadow-2xl relative overflow-hidden flex items-center justify-center"
                            style={backgroundStyle}
                        >
                            <div className="w-full h-full relative p-4">
                                <Image
                                    src={logoUrl}
                                    alt="App Icon"
                                    fill
                                    className="object-contain"
                                    style={logoStyle}
                                    unoptimized={logoUrl.startsWith('data:')}
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-2">App Icon</p>
                </div>

                {/* 4. Social Profile (Brand Voice) */}
                <div className="flex flex-col">
                    <div className="relative w-full aspect-[3/4] md:aspect-square bg-white overflow-hidden shadow-sm flex flex-col max-h-full">
                        {/* Status Bar */}
                        <div className="h-6 bg-white border-b border-gray-50 flex items-center justify-between px-3">
                            <span className="text-[10px] font-medium text-gray-900">9:41</span>
                            <div className="flex gap-1 items-center text-gray-900">
                                <Signal className="w-3 h-3" />
                                <Wifi className="w-3 h-3" />
                                <Battery className="w-3 h-3" />
                            </div>
                        </div>

                        {/* Header Banner */}
                        <div
                            className="h-24 w-full relative"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${logoUrl})`, backgroundSize: '50px', backgroundRepeat: 'space', filter: 'grayscale(1) invert(1)' }}></div>
                        </div>

                        {/* Profile Content */}
                        <div className="px-4 pb-4 relative flex-1">
                            {/* Avatar */}
                            <div
                                className="w-16 h-16 rounded-full absolute -top-8 left-4 border-4 border-white shadow-sm flex items-center justify-center overflow-hidden"
                                style={backgroundStyle}
                            >
                                <div className="w-full h-full relative p-2">
                                    <Image
                                        src={logoUrl}
                                        alt="Avatar"
                                        fill
                                        className="object-contain"
                                        style={logoStyle}
                                        unoptimized={logoUrl.startsWith('data:')}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end pt-3 mb-3">
                                <div className="px-4 py-1.5 rounded-full bg-black text-white text-xs font-bold">
                                    Follow
                                </div>
                            </div>

                            {/* Info */}
                            <div className="mt-2">
                                <h4 className="font-bold text-gray-900 text-sm" style={{ fontFamily: `var(${fontVariable})` }}>{brandName}</h4>
                                <p className="text-xs text-gray-500">@{brandName.toLowerCase().replace(/\s+/g, '')}</p>
                                <p className="text-xs text-gray-700 mt-2 leading-relaxed line-clamp-3">
                                    {tagline}
                                </p>
                                <div className="flex gap-3 mt-3">
                                    <div className="flex gap-1 text-xs">
                                        <span className="font-bold text-gray-900">1.2k</span>
                                        <span className="text-gray-500">Following</span>
                                    </div>
                                    <div className="flex gap-1 text-xs">
                                        <span className="font-bold text-gray-900">8.5k</span>
                                        <span className="text-gray-500">Followers</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">Social Profile</p>
                </div>

            </div>


        </div>
    );
});
