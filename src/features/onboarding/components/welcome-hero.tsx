'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface WelcomeHeroProps {
    ctaButton?: ReactNode;
}

const EASE = [0.22, 1, 0.36, 1] as const;

const VALUE_PROPS = [
    {
        label: 'Position',
        title: 'Clarify Your Position',
        body: 'Define your brand strategy, target audience, and unique value proposition with AI guidance.',
    },
    {
        label: 'Generate',
        title: 'Generate Visual Assets',
        body: 'Create logos, color palettes, presentations, and mockups that reflect your brand identity.',
    },
    {
        label: 'Keep',
        title: 'Stay Consistent',
        body: 'Maintain brand consistency across web, apps, and all customer touchpoints automatically.',
    },
];

export function WelcomeHero({ ctaButton }: WelcomeHeroProps) {
    return (
        <div className="space-y-8 max-w-4xl mx-auto text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
            >
                <h1 className="text-5xl md:text-7xl font-black tracking-tight text-foreground leading-[1.1]">
                    Clarify your brand.
                    <br />
                    <span className="text-muted-foreground">Generate on-brand assets.</span>
                </h1>
            </motion.div>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
                className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed max-w-3xl mx-auto"
            >
                Agentic AI that helps you define your positioning, create professional visual assets,
                and maintain brand consistency across every touchpoint.
            </motion.p>

            {ctaButton && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
                    className="pt-2"
                >
                    {ctaButton}
                </motion.div>
            )}

            {/* Value props as Studio-style slots: dashed frame, pill label, ink on paper. */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8"
            >
                {VALUE_PROPS.map((prop, i) => (
                    <div
                        key={prop.label}
                        className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-foreground/30 bg-card p-6 text-left transition-colors hover:border-foreground"
                    >
                        <span className="rounded-full border border-foreground bg-foreground px-3 py-1 text-xs font-medium text-background">
                            {i + 1} · {prop.label}
                        </span>
                        <h3 className="font-bold text-lg">{prop.title}</h3>
                        <p className="text-sm text-muted-foreground">{prop.body}</p>
                    </div>
                ))}
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="pt-4"
            >
                <p className="text-base text-muted-foreground/80 max-w-2xl mx-auto">
                    Look professional from day one. Attract investors and customers with a cohesive brand
                    that communicates trust and expertise.
                </p>
            </motion.div>
        </div>
    );
}
