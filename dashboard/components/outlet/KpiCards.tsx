'use client';

import { LucideIcon } from 'lucide-react';

interface KPICard {
    title: string;
    value: string | number;
    icon: LucideIcon;
    accentColor: string;
    accentBackground?: string;
    description?: string;
    comparison?: Array<{
        label: string;
        value: string;
    }>;
}

interface KpiCardsProps {
    kpis: KPICard[];
}

export default function KpiCards({ kpis }: KpiCardsProps) {
    if (!kpis.length) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
                <div
                    key={kpi.title}
                    className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className={`rounded-lg p-2.5 ${kpi.accentBackground ?? 'bg-gray-100 dark:bg-gray-800/60'}`}>
                            <div className={`text-sm ${kpi.accentColor}`}>
                                <kpi.icon className='w-5 h-5' />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500">
                                {kpi.title}
                            </p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {kpi.value}
                            </p>
                        </div>

                        {kpi.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {kpi.description}
                            </p>
                        )}
                    </div>

                    {kpi.comparison?.length ? (
                        <div className="mt-4 space-y-2 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-500">
                            {kpi.comparison.map((item) => (
                                <div key={item.label} className="flex items-center justify-between gap-3">
                                    <span>{item.label}</span>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            ))}
        </div>
    );
}
