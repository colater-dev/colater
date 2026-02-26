'use client';

import { motion } from 'framer-motion';
import { Zap, Download, Shield, RefreshCw } from 'lucide-react';

export function FeaturesSection() {
    return (
        <div className="w-full space-y-16">
            {/* Core Features */}
            <div className="space-y-8">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="p-8 rounded-2xl bg-white border border-gray-200"
                    >
                        <Zap className="w-12 h-12 text-primary mb-4" />
                        <h3 className="text-2xl font-bold mb-3">AI-Powered Brand Strategy</h3>
                        <p className="text-muted-foreground mb-4">
                            Answer a few questions and let our AI help you articulate your brand positioning,
                            target audience, and unique value proposition. Get clarity on what makes you different.
                        </p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>Brand name ideation and validation</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>Target audience definition</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>Competitive positioning analysis</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>Tagline and messaging suggestions</span>
                            </li>
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="p-8 rounded-2xl bg-white border border-gray-200"
                    >
                        <Download className="w-12 h-12 text-primary mb-4" />
                        <h3 className="text-2xl font-bold mb-3">Professional Visual Assets</h3>
                        <p className="text-muted-foreground mb-4">
                            Generate production-ready logos, color palettes, mockups, and presentations.
                            Export everything you need to launch with confidence.
                        </p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>Multiple logo variations (color, monochrome, icon)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>Harmonious color palettes with hex codes</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>Business card and mockup previews</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>Presentation-ready brand guidelines</span>
                            </li>
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="p-8 rounded-2xl bg-white border border-gray-200"
                    >
                        <RefreshCw className="w-12 h-12 text-primary mb-4" />
                        <h3 className="text-2xl font-bold mb-3">Iterate Until It&apos;s Perfect</h3>
                        <p className="text-muted-foreground mb-4">
                            Don&apos;t settle for the first result. Regenerate assets, adjust colors, and refine your
                            messaging until everything feels exactly right.
                        </p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>Unlimited logo generation attempts</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>AI critique and improvement suggestions</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>Fine-tune colors, sizing, and layouts</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>Save multiple variations for comparison</span>
                            </li>
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="p-8 rounded-2xl bg-white border border-gray-200"
                    >
                        <Shield className="w-12 h-12 text-primary mb-4" />
                        <h3 className="text-2xl font-bold mb-3">Maintain Consistency</h3>
                        <p className="text-muted-foreground mb-4">
                            Your brand guidelines stored in one place. Ensure every asset, from website to app to
                            marketing materials, stays on-brand automatically.
                        </p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>Centralized brand asset library</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>Usage guidelines and best practices</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>Brand compliance checking</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">✓</span>
                                <span>Team collaboration and sharing</span>
                            </li>
                        </ul>
                    </motion.div>
                </div>
            </div>

            {/* MCP Server Section - Commented out for now */}
            {/* <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-2 border-primary/30 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />

                <div className="relative z-10 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                            <Code className="w-8 h-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <div className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                                For Developers
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black">Colater MCP Server</h2>
                            <p className="text-lg text-muted-foreground">
                                Integrate your brand directly into your development workflow with our Model Context Protocol server.
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 pt-4">
                        <div className="space-y-4">
                            <h3 className="font-bold text-xl">What is it?</h3>
                            <p className="text-muted-foreground">
                                The Colater MCP Server connects your brand assets and guidelines to AI coding assistants like
                                Claude, Cursor, and other MCP-compatible tools. Generate code components that automatically
                                match your brand's colors, fonts, and styling.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold text-xl">Key Features</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <Boxes className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                                    <span>Generate React, Vue, or native components with your brand colors</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Boxes className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                                    <span>Automatically apply your typography and spacing guidelines</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Boxes className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                                    <span>Access your logo assets and color palettes in your IDE</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Boxes className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                                    <span>Ensure brand consistency across all code contributions</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-6 flex flex-col sm:flex-row gap-4">
                        <Button
                            asChild
                            size="lg"
                            className="gap-2 bg-primary hover:bg-primary/90"
                        >
                            <a href="https://github.com/colater-dev/colater-mcp-server" target="_blank" rel="noopener noreferrer">
                                <Code className="w-4 h-4" />
                                View on GitHub
                            </a>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="gap-2"
                        >
                            <a href="/docs/mcp-server">
                                Learn More
                            </a>
                        </Button>
                    </div>

                    <div className="pt-4 border-t border-border/50">
                        <p className="text-sm text-muted-foreground">
                            <span className="font-semibold">Quick start:</span>{' '}
                            <code className="px-2 py-1 rounded bg-muted text-xs">
                                npm install -g @colater/mcp-server
                            </code>
                        </p>
                    </div>
                </div>
            </motion.div> */}
        </div>
    );
}
