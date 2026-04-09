"use client";

import { Clock, CheckCircle, Play, Hourglass } from "lucide-react";
import { KanbanColumn } from "./KanbanColumn";
import type { QueueV2Board, QueueV2Entry, QueueOrderStatus } from "@/lib/apis/queue-v2";

interface KanbanBoardProps {
    board: QueueV2Board;
    onPrimaryAction: (entry: QueueV2Entry, nextStatus: QueueOrderStatus) => void;
    onCancel: (entry: QueueV2Entry) => void;
    onDetail: (entry: QueueV2Entry) => void;
    onViewProof: (entry: QueueV2Entry) => void;
    pendingId: string | null;
}

const COLUMNS = [
    {
        key: "waiting" as const,
        title: "Menunggu",
        icon: <Hourglass className="w-4 h-4 text-amber-500" />,
        accent: "bg-amber-500",
    },
    {
        key: "ready" as const,
        title: "Siap Dilayani",
        icon: <Clock className="w-4 h-4 text-emerald-500" />,
        accent: "bg-emerald-500",
    },
    {
        key: "inProgress" as const,
        title: "Sedang Dilayani",
        icon: <Play className="w-4 h-4 text-primary" />,
        accent: "bg-primary",
    },
    {
        key: "completed" as const,
        title: "Selesai Hari Ini",
        icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
        accent: "bg-emerald-500",
    },
];

export function KanbanBoard({ board, onPrimaryAction, onCancel, onDetail, onViewProof, pendingId }: KanbanBoardProps) {
    return (
        <>
            {/* Desktop: horizontal columns */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-3">
                {COLUMNS.map((col) => (
                    <KanbanColumn
                        key={col.key}
                        title={col.title}
                        icon={col.icon}
                        entries={board[col.key]}
                        count={board[col.key].length}
                        accentColor={col.accent}
                        onPrimaryAction={onPrimaryAction}
                        onCancel={onCancel}
                        onDetail={onDetail}
                        onViewProof={onViewProof}
                        pendingId={pendingId}
                    />
                ))}
            </div>

            {/* Mobile: stacked columns */}
            <div className="lg:hidden space-y-3">
                {COLUMNS.map((col) => {
                    const entries = board[col.key];
                    // On mobile, skip empty completed column
                    if (col.key === "completed" && entries.length === 0) return null;

                    return (
                        <KanbanColumn
                            key={col.key}
                            title={col.title}
                            icon={col.icon}
                            entries={entries}
                            count={entries.length}
                            accentColor={col.accent}
                            onPrimaryAction={onPrimaryAction}
                            onCancel={onCancel}
                            onDetail={onDetail}
                            onViewProof={onViewProof}
                            pendingId={pendingId}
                        />
                    );
                })}
            </div>
        </>
    );
}
