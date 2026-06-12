"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { QueueCard } from "./queue-card";
import type { QueueV2Entry, QueueOrderStatus } from "@/lib/apis/queue-v2";
import { cn } from "@/lib/utils";

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
        <div className="flex flex-col min-w-[280px] w-full rounded-lg border border-border bg-muted/30">
            {/* Column header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                </div>
                <span
                    className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white",
                        accentColor
                    )}
                >
                    {count}
                </span>
            </div>

            {/* Cards */}
            <ScrollArea className="flex-1 max-h-[calc(100vh-280px)]">
                <div className="p-2 space-y-2">
                    {entries.length === 0 ? (
                        <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
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
