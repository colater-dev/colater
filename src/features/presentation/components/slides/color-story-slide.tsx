'use client';

import { EditableText } from '../editable-text';
import { motion } from 'framer-motion';
import { isLightColor } from '@/lib/color-utils';
import { Palette } from 'lucide-react';

interface ColorStorySlideProps {
    content: {
        colorPhilosophy: string;
        colorUsage: Array<{
            color: string;
            name: string;
            usage: string;
        }>;
    };
    isEditing: boolean;
    onUpdate: (updates: Record<string, unknown>) => void;
    palette: string[];
}

export function ColorStorySlide({ content, isEditing, onUpdate, palette }: ColorStorySlideProps) {
    const colorUsage = content.colorUsage || [];

    const updateColorField = (index: number, field: string, val: string) => {
        const newUsage = [...colorUsage];
        if (!newUsage[index]) return;
        newUsage[index] = { ...newUsage[index], [field]: val };
        onUpdate({ colorUsage: newUsage });
    };

    return (
        <div className="flex flex-col h-full w-full bg-background relative">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-[40cqw_1fr] h-full">
                {/* Left: Philosophy and Names */}
                <div className="p-[8cqw] flex flex-col justify-center space-y-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-primary font-mono uppercase tracking-widest text-xs">
                            <Palette className="w-4 h-4" />
                            <span>Color Story</span>
                        </div>
                        <EditableText
                            value={content.colorPhilosophy}
                            onChange={(val) => onUpdate({ colorPhilosophy: val })}
                            isEditing={isEditing}
                            multiline
                            className="font-black tracking-tight leading-tight"
                            style={{ fontSize: '3cqw' }}
                            placeholder="Describe the philosophy behind your color choices..."
                        />
                    </div>

                    <div className="space-y-4">
                        {colorUsage.map((item, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full shadow-sm border border-gray-100" style={{ backgroundColor: item.color }} />
                                <div className="flex-1">
                                    <EditableText
                                        value={item.name}
                                        onChange={(val) => updateColorField(i, 'name', val)}
                                        isEditing={isEditing}
                                        className="font-bold tracking-tight text-foreground"
                                        style={{ fontSize: '1.4cqw' }}
                                        placeholder={`Color Name ${i + 1}`}
                                    />
                                    <EditableText
                                        value={item.usage}
                                        onChange={(val) => updateColorField(i, 'usage', val)}
                                        isEditing={isEditing}
                                        className="text-muted-foreground font-medium"
                                        style={{ fontSize: '1cqw' }}
                                        placeholder="Primary actions, headlines..."
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Bold Color Swatches */}
                <div className="flex h-full w-full">
                    {(palette.length > 0 ? palette : colorUsage.map(c => c.color)).map((color, i) => (
                        <motion.div
                            key={i}
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="flex-1 h-full relative group flex items-end justify-center p-8 origin-top"
                            style={{ backgroundColor: color }}
                        >
                            <span
                                className="font-mono uppercase tracking-widest opacity-40 mb-4"
                                style={{
                                    color: isLightColor(color) ? 'black' : 'white',
                                    fontSize: '0.9cqw'
                                }}
                            >
                                {color}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
