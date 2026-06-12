"use client";

import { QueueV2Entry, QueueV2Board, QueueOrderStatus } from "@/lib/apis/queue-v2";
import { FocusCard } from "./focus-card";
import { QueueCard } from "./queue-card";
import { 
    Users, 
    ArrowRight, 
    History, 
    Coffee, 
    ClipboardList,
    AlertCircle,
    UserPlus,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

interface ServiceFocusViewProps {
    board: QueueV2Board;
    onPrimaryAction: (entry: QueueV2Entry, nextStatus: QueueOrderStatus) => void;
    onCancel: (entry: QueueV2Entry) => void;
    onDetail: (entry: QueueV2Entry) => void;
    onViewProof: (entry: QueueV2Entry) => void;
    pendingId: string | null;
    isKitchenView?: boolean;
}

export function ServiceFocusView({
    board,
    onPrimaryAction,
    onCancel,
    onDetail,
    onViewProof,
    pendingId,
    isKitchenView = false
}: ServiceFocusViewProps) {
    const activeEntries = board.inProgress;
    
    const upNext = [...board.waiting];
    const recent = [...board.completed].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 5);

    // Group upNext by scheduled time
    const groupedNext = useMemo(() => {
        const groups: Record<string, QueueV2Entry[]> = {};
        upNext.forEach(entry => {
            const time = entry.scheduledStart 
                ? new Date(entry.scheduledStart).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                : "Segera";
            if (!groups[time]) groups[time] = [];
            groups[time].push(entry);
        });
        return Object.entries(groups).sort((a, b) => {
            if (a[0] === "Segera") return -1;
            if (b[0] === "Segera") return 1;
            return a[0].localeCompare(b[0]);
        });
    }, [upNext]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500 pb-10">
            {/* Left: Main Focus Area (8 Columns) */}
            <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">
                            {activeEntries.length > 1 ? "Layanan Aktif Berjalan" : "Layanan Aktif Sekarang"}
                        </h2>
                    </div>
                    {activeEntries.length > 0 && (
                        <Badge variant="secondary" className="font-bold text-[9px] bg-muted/50 border-border/40">
                            {activeEntries.length} LAYANAN PARALEL
                        </Badge>
                    )}
                </div>

                {activeEntries.length > 0 ? (
                    <div className={cn(
                        "grid gap-4",
                        activeEntries.length > 1 ? "grid-cols-1" : "grid-cols-1"
                        // Note: Using 1 col for now to keep FocusCard prominent, 
                        // but it can be changed to md:grid-cols-2 if needed.
                    )}>
                        {activeEntries.map(entry => (
                            <FocusCard
                                key={entry.id}
                                entry={entry}
                                onPrimaryAction={onPrimaryAction}
                                onCancel={onCancel}
                                onDetail={onDetail}
                                onViewProof={onViewProof}
                                isPending={pendingId === entry.id}
                                isKitchenView={isKitchenView}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-muted/10 border-2 border-dashed border-border/40 rounded-md p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[350px]">
                        <div className="w-16 h-16 bg-muted/40 rounded-full flex items-center justify-center mb-2">
                            <Coffee className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-foreground/60">Tidak Ada Layanan Aktif</h3>
                            <p className="text-xs text-muted-foreground/50 max-w-xs mx-auto font-medium">
                                Belum ada pelanggan yang sedang dilayani saat ini.
                            </p>
                        </div>
                        {upNext.length > 0 && (
                            <Button 
                                size="lg" 
                                className="mt-4"
                                onClick={() => onPrimaryAction(upNext[0], 'ON_GOING')}
                            >
                                <UserPlus className="w-4 h-4" />
                                Panggil Antrean #{upNext[0].position}
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Right: Lists & History (4 Columns) */}
            <div className="lg:col-span-4 space-y-6">
                {/* Next Up Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">Antrean Berikutnya</h2>
                        </div>
                        <Badge variant="outline" className="font-bold tabular-nums text-[10px] bg-emerald-500/5 text-emerald-600 border-emerald-500/20">
                            {upNext.length}
                        </Badge>
                    </div>

                    <ScrollArea className="h-[450px] pr-4 -mr-4">
                        <div className="space-y-6">
                            {groupedNext.length > 0 ? (
                                groupedNext.map(([time, entries]) => (
                                    <div key={time} className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3 h-3 text-muted-foreground/40" />
                                            <span className="text-[10px] font-bold text-muted-foreground">{time}</span>
                                            <div className="flex-1 h-px bg-border/40" />
                                            {entries.length > 1 && (
                                                <span className="text-[9px] font-bold text-emerald-600/60 uppercase">{entries.length} Layanan Paralel</span>
                                            )}
                                        </div>
                                        <div className="space-y-3">
                                            {entries.map((entry) => (
                                                <QueueCard
                                                    key={entry.id}
                                                    entry={entry}
                                                    onPrimaryAction={onPrimaryAction}
                                                    onCancel={onCancel}
                                                    onDetail={onDetail}
                                                    onViewProof={onViewProof}
                                                    isPending={pendingId === entry.id}
                                                    isKitchenView={isKitchenView}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 border border-dashed border-border/40 rounded-md text-center bg-muted/5">
                                    <AlertCircle className="w-6 h-6 text-muted-foreground/20 mx-auto mb-2" />
                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30">Belum Ada Antrean</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Recent Activity Section */}
                <div className="space-y-4 pt-6 border-t border-border/40">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-muted-foreground opacity-30 rounded-full" />
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">Baru Saja Selesai</h2>
                    </div>

                    <div className="space-y-2">
                        {recent.length > 0 ? (
                            recent.map((entry) => (
                                <div 
                                    key={entry.id} 
                                    className="flex items-center justify-between p-3 rounded-md bg-muted/10 border border-border/20 group hover:bg-muted/20 hover:border-border/40 transition-all cursor-pointer"
                                    onClick={() => onDetail(entry)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-md bg-muted/40 border border-border/40 flex items-center justify-center font-bold text-xs tabular-nums text-foreground/70">
                                            {entry.position}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-foreground/80 leading-none mb-1">{entry.customerName}</p>
                                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight opacity-60">{entry.productName}</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))
                        ) : (
                            <p className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-[0.2em] text-center py-6">Belum Ada Riwayat</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
