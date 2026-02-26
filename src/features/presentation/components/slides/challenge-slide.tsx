'use client';

import { Logo } from '@/lib/types';
import { EditableText } from '../editable-text';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface ChallengeSlideProps {
    content: {
        challengeTitle: string;
        problemStatement: string;
        marketContext: string;
    };
    isEditing: boolean;
    onUpdate: (updates: Record<string, string>) => void;
    logo?: Logo;
}

export function ChallengeSlide({ content, isEditing, onUpdate, logo }: ChallengeSlideProps) {
    return (
        <div className="flex flex-col items-start justify-center h-full w-full relative overflow-hidden p-[8cqw] bg-background">
            {/* Watermark Logo Background */}
            {logo?.logoUrl && (
                <div className="absolute -right-[15cqw] -top-[15cqw] w-[60cqw] h-[60cqw] opacity-5 pointer-events-none rotate-12">
                    <Image
                        src={logo.logoUrl}
                        alt="Watermark"
                        fill
                        className="object-contain grayscale"
                    />
                </div>
            )}

            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative z-10 space-y-8 max-w-4xl"
            >
                <div>
                    <EditableText
                        value={content.challengeTitle || "The Challenge"}
                        onChange={(val) => onUpdate({ challengeTitle: val })}
                        isEditing={isEditing}
                        className="font-mono uppercase tracking-[0.3em] text-primary mb-4"
                        style={{ fontSize: '1.2cqw' }}
                    />
                    <div className="w-20 h-1 bg-primary/20" />
                </div>

                <EditableText
                    value={content.problemStatement}
                    onChange={(val) => onUpdate({ problemStatement: val })}
                    isEditing={isEditing}
                    multiline
                    className="font-black tracking-tight leading-tight"
                    style={{ fontSize: '3cqw' }}
                    placeholder="Describe the main problem your brand solves..."
                />

                <div className="border-l-4 border-primary/20 pl-[4cqw] max-w-2xl py-2">
                    <EditableText
                        value={content.marketContext}
                        onChange={(val) => onUpdate({ marketContext: val })}
                        isEditing={isEditing}
                        multiline
                        className="text-muted-foreground font-medium italic"
                        style={{ fontSize: '1.5cqw' }}
                        placeholder="Provide more context about the market or pain points..."
                    />
                </div>
            </motion.div>
        </div>
    );
}
