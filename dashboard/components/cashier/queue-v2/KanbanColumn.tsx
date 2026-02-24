"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { QueueCard } from "./QueueCard";
import type { QueueV2Entry, QueueOrderStatus } from "@/lib/apis/queue-v2";

interface KanbanColumnProps {
    title: string;
    icon: React.ReactNode;
    entries: QueueV2Entry[];
    count: number;
    accentColor: string;
    onPrimaryAction: (entry: QueueV2Entry, nextStatus: QueueOrderStatus) => void;
    onCancel: (entry: QueueV2Entry) => void;
    onDetail: (entry: QueueV2Entry) => void;
    onViewProof: (entry: QueueV2Entry) => void;
    pendingId: string | null;
}

export function KanbanColumn({
    title,
    icon,
    entries,
    count,
    accentColor,
    onPrimaryAction,
    onCancel,
    onDetail,
    onViewProof,
    pendingId,
}: KanbanColumnProps) {
    return (
        <div className="flex flex-col min-w-[280px] w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
                </div>
                <span
                    className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${accentColor}`}
                >
                    {count}
                </span>
            </div>

            {/* Cards */}
            <ScrollArea className="flex-1 max-h-[calc(100vh-280px)]">
                <div className="p-2 space-y-2">
                    {entries.length === 0 ? (
                        <div className="flex items-center justify-center py-8 text-xs text-slate-400 dark:text-slate-500">
                            Tidak ada antrian
                        </div>
                    ) : (
                        entries.map((entry) => (
                            <QueueCard
                                key={entry.id}
                                entry={entry}
                                onPrimaryAction={onPrimaryAction}
                                onCancel={onCancel}
                                onDetail={onDetail}
                                onViewProof={onViewProof}
                                isPending={pendingId === entry.id}
                            />
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
