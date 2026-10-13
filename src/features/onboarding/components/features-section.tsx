'use client';

import { motion } from 'framer-motion';

const FEATURES = [
    {
        label: 'Strategy',
        title: 'AI-Powered Brand Strategy',
        body: 'Answer a few questions and let our AI help you articulate your brand positioning, target audience, and unique value proposition. Get clarity on what makes you different.',
        points: [
            'Brand name ideation and validation',
            'Target audience definition',
            'Competitive positioning analysis',
            'Tagline and messaging suggestions',
        ],
    },
    {
        label: 'Assets',
        title: 'Professional Visual Assets',
        body: 'Generate production-ready logos, color palettes, mockups, and presentations. Export everything you need to launch with confidence.',
        points: [
            'Multiple logo variations (color, monochrome, icon)',
            'Harmonious color palettes with hex codes',
            'Business card and mockup previews',
            'Presentation-ready brand guidelines',
        ],
    },
    {
        label: 'Iterate',
        title: "Iterate Until It's Perfect",
        body: "Don't settle for the first result. Regenerate assets, adjust colors, and refine your messaging until everything feels exactly right.",
        points: [
            'Unlimited logo generation attempts',
            'AI critique and improvement suggestions',
            'Fine-tune colors, sizing, and layouts',
            'Save multiple variations for comparison',
        ],
    },
    {
        label: 'Consistency',
        title: 'Maintain Consistency',
        body: 'Your brand guidelines stored in one place. Ensure every asset, from website to app to marketing materials, stays on-brand automatically.',
        points: [
            'Centralized brand asset library',
            'Usage guidelines and best practices',
            'Brand compliance checking',
            'Team collaboration and sharing',
        ],
    },
];

export function FeaturesSection() {
    return (
        <div className="w-full space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center space-y-4"
            >
                <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                    Everything you need to build your brand
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    From strategy to execution, Colater guides you through every step of brand creation.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
                {FEATURES.map((feature, i) => (
                    <motion.div
                        key={feature.label}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 * (i + 1) }}
                        className="rounded-xl border bg-card p-8 transition-colors hover:border-foreground"
                    >
                        <span className="mb-4 inline-block rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                            {feature.label}
                        </span>
                        <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                        <p className="text-muted-foreground mb-4">{feature.body}</p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            {feature.points.map(point => (
                                <li key={point} className="flex items-start gap-2">
                                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
