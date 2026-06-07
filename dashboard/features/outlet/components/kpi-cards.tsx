"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi, idx) => (
                <Card
                    key={kpi.title}
                    className="group gap-0 py-0 relative overflow-hidden rounded-md border-border/60 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-background to-muted/20"
                >
                    {/* Decorative Background Element */}
                    <div className={cn(
                        "absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-5 transition-transform duration-500 group-hover:scale-150",
                        kpi.accentBackground || "bg-primary"
                    )} />

                    <CardContent className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className={cn(
                                "p-2.5 rounded-lg transition-colors duration-300",
                                kpi.accentBackground || "bg-primary/10",
                                kpi.accentColor || "text-primary"
                            )}>
                                <kpi.icon className="h-5 w-5" />
                            </div>
                            {kpi.description && (
                                <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                    kpi.description.includes('Turun') || kpi.description.includes('Di bawah')
                                        ? "bg-red-500/10 text-red-600 border-red-500/20"
                                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                )}>
                                    {kpi.description.split(' ').pop()}
                                </span>
                            )}
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                {kpi.title}
                            </p>
                            <p className="text-2xl font-black tracking-tight text-foreground tabular-nums">
                                {kpi.value}
                            </p>
                        </div>

                        {kpi.comparison && kpi.comparison.length > 0 && (
                            <div className="pt-4 border-t border-border/40 grid grid-cols-2 gap-4">
                                {kpi.comparison.map((comp, cIdx) => (
                                    <div key={cIdx} className="space-y-0.5">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                                            {comp.label}
                                        </p>
                                        <p className="text-xs font-bold text-foreground">
                                            {comp.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {kpi.description && (
                            <p className="text-[10px] text-muted-foreground italic font-medium pt-1">
                                {kpi.description}
                            </p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
