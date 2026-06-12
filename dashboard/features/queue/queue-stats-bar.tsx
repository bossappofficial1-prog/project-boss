"use client";

import { Users, Clock, CheckCircle, XCircle, Timer, Activity } from "lucide-react";
import type { QueueV2Stats } from "@/lib/apis/queue-v2";
import { cn } from "@/lib/utils";

interface QueueStatsBarProps {
    stats: QueueV2Stats;
}

const STAT_ITEMS = [
    {
        key: "totalActive",
        label: "Aktif",
        icon: Activity,
        color: "text-primary",
        bg: "bg-primary/10",
    },
    {
        key: "waitingCount",
        label: "Menunggu",
        icon: Clock,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
    },
    {
        key: "readyCount",
        label: "Siap",
        icon: Users,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
    },
    {
        key: "inProgressCount",
        label: "Dilayani",
        icon: Timer,
        color: "text-primary",
        bg: "bg-primary/10",
    },
    {
        key: "completedToday",
        label: "Selesai",
        icon: CheckCircle,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
    },
    {
        key: "cancelledToday",
        label: "Batal",
        icon: XCircle,
        color: "text-destructive",
        bg: "bg-destructive/10",
    },
] as const;

export function QueueStatsBar({ stats }: QueueStatsBarProps) {
    return (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {STAT_ITEMS.map((item) => {
                const Icon = item.icon;
                const value = stats[item.key as keyof QueueV2Stats];
                return (
                    <div
                        key={item.key}
                        className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                    >
                        <div className={cn("p-1.5 rounded-md", item.bg)}>
                            <Icon className={cn("w-4 h-4", item.color)} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-lg font-bold text-foreground leading-tight">
                                {value ?? 0}
                            </p>
                            <p className="text-[10px] text-muted-foreground leading-tight">
                                {item.label}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
