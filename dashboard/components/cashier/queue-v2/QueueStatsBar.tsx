"use client";

import { Users, Clock, CheckCircle, XCircle, Timer, Activity } from "lucide-react";
import type { QueueV2Stats } from "@/lib/apis/queue-v2";

interface QueueStatsBarProps {
    stats: QueueV2Stats;
}

const STAT_ITEMS = [
    {
        key: "totalActive",
        label: "Aktif",
        icon: Activity,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
        key: "waitingCount",
        label: "Menunggu",
        icon: Clock,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-950",
    },
    {
        key: "readyCount",
        label: "Siap",
        icon: Users,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-950",
    },
    {
        key: "inProgressCount",
        label: "Dilayani",
        icon: Timer,
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-50 dark:bg-purple-950",
    },
    {
        key: "completedToday",
        label: "Selesai",
        icon: CheckCircle,
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-50 dark:bg-green-950",
    },
    {
        key: "cancelledToday",
        label: "Batal",
        icon: XCircle,
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-950",
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
                        className={`flex items-center gap-3 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2.5 ${item.bg}`}
                    >
                        <Icon className={`w-4 h-4 ${item.color} shrink-0`} />
                        <div className="min-w-0">
                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                                {value ?? 0}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                                {item.label}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
