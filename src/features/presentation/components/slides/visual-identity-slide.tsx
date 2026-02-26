'use client';

import { Brand, Logo } from '@/lib/types';
import Image from 'next/image';
import { isLightColor } from '@/lib/color-utils';
import { motion } from 'framer-motion';

interface VisualIdentitySlideProps {
    brand: Brand;
    logo?: Logo;
    palette: string[];
}

export function VisualIdentitySlide({ logo, palette }: VisualIdentitySlideProps) {
    const colorLogoUrl = logo?.colorLogoUrl || (logo?.colorVersions && logo.colorVersions[0]?.colorLogoUrl) || logo?.logoUrl;
    const monochromeLogoUrl = logo?.logoUrl;
    const invertLogoSetting = !!logo?.displaySettings?.invertLogo;
    const contrast = logo?.displaySettings?.logoContrast ?? 100;
    const brandColor = palette[0] || '#6366F1';

    const items = [
        {
            bg: 'white',
            logo: colorLogoUrl,
            label: 'Primary Color',
            invert: false
        },
        {
            bg: brandColor,
            logo: monochromeLogoUrl,
            label: 'On Brand Color',
            invert: !isLightColor(brandColor) !== invertLogoSetting
        },
        {
            bg: 'black',
            logo: monochromeLogoUrl,
            label: 'On Dark',
            invert: !invertLogoSetting
        },
        {
            bg: '#f8f9fa',
            logo: logo?.logoUrl,
            label: 'The Mark',
            isIcon: true,
            invert: invertLogoSetting
        },
    ];

    return (
        <div className="grid grid-cols-2 grid-rows-2 h-full w-full bg-gray-50">
            {items.map((item, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-center justify-center relative p-[6cqw] group border border-gray-200/20 hover:border-gray-300/30 transition-all duration-300"
                    style={{ backgroundColor: item.bg }}
                >
                    <div className={`relative ${item.isIcon ? "w-[40%] h-[40%]" : "w-[65%] h-[65%]"}`}>
                        {item.logo ? (
                            <Image
                                src={item.logo}
                                alt={item.label}
                                fill
                                className="object-contain transition-all duration-500 group-hover:scale-105"
                                style={{ filter: `contrast(${contrast}%)${item.invert ? ' invert(1)' : ''}` }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-10">
                                <span className="font-mono text-[1.5cqw]">Logo</span>
                            </div>
                        )}
                    </div>
                    <span
                        className="absolute bottom-8 left-8 font-mono text-[1cqw] uppercase tracking-[0.3em] opacity-40 group-hover:opacity-60 transition-opacity"
                        style={{ color: isLightColor(item.bg) ? 'black' : 'white' }}
                    >
                        {item.label}
                    </span>
                </motion.div>
            ))}
        </div>
    );
}
