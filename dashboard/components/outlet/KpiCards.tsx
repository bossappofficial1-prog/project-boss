'use client';

import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

interface KPICard {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: number; // percentage
    trendLabel?: string;
    bgGradient: string;
    accentColor: string;
    comparison?: {
        label: string;
        value: string;
    };
}

interface KpiCardsProps {
    kpis: KPICard[];
}

export default function KpiCards({ kpis }: KpiCardsProps) {
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpis.map((kpi, index) => (
                <div
                    key={index}
                    className={`relative group cursor-pointer transition-all duration-300 ease-out transform
            ${hoveredCard === index ? 'scale-100 shadow-2xl' : 'scale-100 shadow-lg'}
          `}
                    onMouseEnter={() => setHoveredCard(index)}
                    onMouseLeave={() => setHoveredCard(null)}
                >
                    {/* Gradient Background */}
                    <div
                        className={`absolute inset-0 ${kpi.bgGradient} rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300`}
                    />

                    {/* Card Container */}
                    <div className="relative rounded-2xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-6 overflow-hidden">
                        {/* Glassmorphism Shine Effect */}
                        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-x-1/3 -translate-y-1/3 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-300" />

                        {/* Content */}
                        <div className="relative z-10">
                            {/* Header with Icon */}
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl ${kpi.accentColor} bg-opacity-20 backdrop-blur-sm`}>
                                    <div className={kpi.accentColor}>
                                        {kpi.icon}
                                    </div>
                                </div>

                                {/* Trend Indicator */}
                                {kpi.trend !== undefined && (
                                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full backdrop-blur-sm transition-all duration-300 ${kpi.trend >= 0
                                        ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                                        : 'bg-red-500/20 text-red-600 dark:text-red-400'
                                        }`}>
                                        {kpi.trend >= 0 ? (
                                            <ArrowUpRight className="w-3 h-3" />
                                        ) : (
                                            <ArrowDownRight className="w-3 h-3" />
                                        )}
                                        <span className="text-xs font-semibold">
                                            {Math.abs(kpi.trend)}%
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
                                {kpi.title}
                            </h3>

                            {/* Value */}
                            <div className="mb-3">
                                <p className={`text-3xl lg:text-4xl font-bold bg-gradient-to-r ${kpi.bgGradient} bg-clip-text text-transparent transition-transform duration-300 ${hoveredCard === index ? 'scale-110' : 'scale-100'
                                    }`}>
                                    {kpi.value}
                                </p>
                            </div>

                            {/* Comparison Text */}
                            {kpi.comparison && (
                                <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1 pt-3 border-t border-white/10 dark:border-gray-700/50">
                                    <p className="flex justify-between">
                                        <span>{kpi.comparison.label}:</span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                                            {kpi.comparison.value}
                                        </span>
                                    </p>
                                </div>
                            )}

                            {/* Trend Label */}
                            {kpi.trendLabel && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    {kpi.trendLabel}
                                </p>
                            )}
                        </div>

                        {/* Animated Border */}
                        <div className={`absolute inset-0 rounded-2xl border border-transparent pointer-events-none transition-all duration-300 ${hoveredCard === index ? `border-${kpi.accentColor.split('-')[1]}-400/50` : ''
                            }`} />
                    </div>
                </div>
            ))}
        </div>
    );
}
