'use client';

import { Brand, Logo } from '@/lib/types';
import { EditableText } from '../editable-text';
import Image from 'next/image';
import { BRAND_FONTS } from '@/config/brand-fonts';
import { motion } from 'framer-motion';
import { isLightColor } from '@/lib/color-utils';
import { useLogoBalance } from '@/hooks/use-logo-balance';

interface CoverSlideProps {
    content: {
        brandName: string;
        tagline: string;
        clientName?: string;
        backgroundColor?: string;
    };
    isEditing: boolean;
    onUpdate: (updates: Record<string, string>) => void;
    brand: Brand;
    logo?: Logo;
    palette?: string[];
}

export function CoverSlide({ content, isEditing, onUpdate, brand, logo }: CoverSlideProps) {
    const font = BRAND_FONTS.find(f => f.name === (logo?.font || brand?.font)) || BRAND_FONTS[0];
    const bgColor = content.backgroundColor || (brand.displaySettings?.invertLogo ? '#000000' : '#ffffff');
    const isDark = !isLightColor(bgColor);
    const textColor = isDark ? 'white' : 'black';
    // Auto-calculate optimal balance between logo and text
    const { displaySettings: autoBalance } = useLogoBalance(
        logo?.logoUrl,
        content.brandName || brand.latestName,
        font.name
    );

    const settings = logo?.displaySettings;

    // Use auto-calculated balance if available, otherwise fall back to manual setting or default
    const balance = autoBalance?.verticalLogoTextBalance ?? settings?.verticalLogoTextBalance ?? 50;

    const logoSize = 18 * (1.5 - (balance / 100));
    const fontSize = 7 * (0.5 + (balance / 100)) * (font.sizeMultiplier || 1.0);
    const contrast = settings?.logoContrast ?? 100;

    return (
        <div
            className="flex flex-col items-center justify-center h-full text-center relative overflow-hidden transition-colors duration-700"
            style={{ backgroundColor: bgColor }}
        >
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 flex flex-col items-center w-full max-w-5xl px-[8cqw]"
            >
                {/* Logo and Name Lockup */}
                <div className="flex flex-col items-center space-y-[3cqw]">
                    {logo?.logoUrl && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="relative"
                            style={{ width: `${logoSize}cqw`, height: `${logoSize}cqw` }}
                        >
                            <Image
                                src={logo.logoUrl}
                                alt="Brand Logo"
                                fill
                                className="object-contain"
                                style={{
                                    filter: `contrast(${contrast}%)${isDark !== !!settings?.invertLogo ? ' invert(1)' : ''}`
                                }}
                            />
                        </motion.div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <EditableText
                            value={content.brandName || brand.latestName}
                            onChange={(val) => onUpdate({ brandName: val })}
                            isEditing={isEditing}
                            className="font-black tracking-tighter leading-[0.95]"
                            style={{
                                fontFamily: `var(${font.variable})`,
                                fontSize: `${fontSize}cqw`,
                                color: textColor,
                                textTransform: logo?.displaySettings?.textTransform || 'none'
                            }}
                        />
                    </motion.div>
                </div>

                {/* Tagline */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="mt-[4cqw]"
                >
                    <EditableText
                        value={content.tagline || brand.primaryTagline || "Crafting tomorrow's identity, today"}
                        onChange={(val) => onUpdate({ tagline: val })}
                        isEditing={isEditing}
                        className="font-medium tracking-tight leading-relaxed max-w-3xl mx-auto"
                        style={{ fontSize: '2.2cqw', color: textColor, opacity: 0.75 }}
                    />
                </motion.div>

                {/* Decorative line */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-[3cqw] h-px w-24 origin-center"
                    style={{
                        background: `linear-gradient(to right, transparent, ${textColor}, transparent)`,
                        opacity: 0.2
                    }}
                />

                {/* Client Name */}
                {(content.clientName || isEditing) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="mt-[3cqw]"
                    >
                        <EditableText
                            value={content.clientName || ""}
                            onChange={(val) => onUpdate({ clientName: val })}
                            isEditing={isEditing}
                            className="font-mono uppercase tracking-[0.4em] text-[1cqw]"
                            placeholder="Presented to [Client Name]"
                            style={{ color: textColor, opacity: 0.4 }}
                        />
                    </motion.div>
                )}
            </motion.div>

        </div>
    );
}
