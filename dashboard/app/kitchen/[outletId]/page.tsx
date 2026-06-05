"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrdersV2Board } from "@/hooks/api/use-orders-v2";
import { KitchenTicket } from "@/components/kitchen/KitchenTicket";
import { getSocket } from "@/lib/socket-v2";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, UtensilsCrossed, Monitor, AlertCircle, ArrowLeft, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { outletManagementApi } from "@/lib/apis/outletManagement";
import { useQuery } from "@tanstack/react-query";
import { Clocks } from "@/components/shared/Clock";
import { cn } from "@/lib/utils";

const LANES = [
    {
        key: "pending",
        label: "Antrian",
        sublabel: "Menunggu diproses",
        dotClass: "bg-chart-4",
        headerClass: "border-chart-4/30 bg-chart-4/5",
        labelClass: "text-chart-4",
        countClass: "bg-chart-4/10 text-chart-4 border border-chart-4/20",
        emptyClass: "text-chart-4/20",
    },
    {
        key: "processing",
        label: "Dimasak",
        sublabel: "Sedang disiapkan",
        dotClass: "bg-chart-1",
        headerClass: "border-chart-1/30 bg-chart-1/5",
        labelClass: "text-chart-1",
        countClass: "bg-chart-1/10 text-chart-1 border border-chart-1/20",
        emptyClass: "text-chart-1/20",
    },
    {
        key: "ready",
        label: "Siap",
        sublabel: "Siap disajikan",
        dotClass: "bg-chart-3",
        headerClass: "border-chart-3/30 bg-chart-3/5",
        labelClass: "text-chart-3",
        countClass: "bg-chart-3/10 text-chart-3 border border-chart-3/20",
        emptyClass: "text-chart-3/20",
    },
] as const;

function KdsLoader() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-5">
            <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center">
                    <ChefHat className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                </div>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-muted-foreground">
                Menghubungkan ke Dapur
            </p>
        </div>
    );
}

function KdsError({ onBack }: { onBack: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-1.5">
                <h1 className="text-xl font-semibold text-foreground tracking-tight">Outlet Tidak Ditemukan</h1>
                <p className="text-sm text-muted-foreground max-w-sm">
                    ID outlet tidak valid atau Anda tidak memiliki akses ke outlet ini.
                </p>
            </div>
            <Button onClick={onBack} variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali
            </Button>
        </div>
    );
}

function LiveDot({ connected }: { connected: boolean }) {
    return (
        <span className="relative flex h-2 w-2">
            {connected ? (
                <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chart-3 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-chart-3" />
                </>
            ) : (
                <span className="relative inline-flex h-2 w-2 rounded-full bg-muted-foreground/30" />
            )}
        </span>
    );
}

function LaneColumn({
    lane,
    orders,
}: {
    lane: (typeof LANES)[number];
    orders: NonNullable<ReturnType<typeof useOrdersV2Board>["data"]>["board"]["pending"];
}) {
    const count = orders?.length ?? 0;

    return (
        <div className="flex flex-col min-h-0 h-full">
            <div className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl border mb-3 shrink-0",
                lane.headerClass
            )}>
                <div className="flex items-center gap-2.5">
                    <div className={cn("w-2 h-2 rounded-full", lane.dotClass)} />
                    <div>
                        <p className={cn("text-xs font-bold uppercase tracking-widest leading-none", lane.labelClass)}>
                            {lane.label}
                        </p>
                        <p className="text-[9px] text-muted-foreground/50 mt-0.5 uppercase tracking-wider">
                            {lane.sublabel}
                        </p>
                    </div>
                </div>
                <span className={cn("text-sm font-black tabular-nums px-2.5 py-0.5 rounded-md", lane.countClass)}>
                    {count}
                </span>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-0.5">
                {count === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-xl border border-dashed border-border">
                        <UtensilsCrossed className={cn("w-8 h-8", lane.emptyClass)} />
                        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground/30">Kosong</p>
                    </div>
                ) : (
                    orders?.map((order) => (
                        <KitchenTicket key={order.id} entry={order} />
                    ))
                )}
            </div>
        </div>
    );
}

export default function KitchenPage() {
    const params = useParams();
    const router = useRouter();
    const outletId = params.outletId as string;
    const queryClient = useQueryClient();
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isConnected, setIsConnected] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const { data: outlet, isLoading: isOutletLoading, isError: isOutletError } = useQuery({
        queryKey: ["outlet", outletId],
        queryFn: () => outletManagementApi.getById(outletId),
        enabled: !!outletId,
        retry: 1,
    });

    const { data, isLoading: isBoardLoading } = useOrdersV2Board(outletId);

    useEffect(() => {
        if (!outletId) return;

        const socket = getSocket();
        socket.emit("join:outlet", { outletId });

        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ["orders-v2", "board", outletId] });
            setLastUpdate(new Date());
        };

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("order:new", handleUpdate);
        socket.on("order:itemsAdded", handleUpdate);
        socket.on("order:statusChanged", handleUpdate);
        socket.on("order:completed", handleUpdate);
        socket.on("queue:updated", handleUpdate);
        socket.on("payment:new", handleUpdate);

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("order:new", handleUpdate);
            socket.off("order:itemsAdded", handleUpdate);
            socket.off("order:statusChanged", handleUpdate);
            socket.off("order:completed", handleUpdate);
            socket.off("queue:updated", handleUpdate);
            socket.off("payment:new", handleUpdate);
        };
    }, [outletId, queryClient]);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(console.error);
            setIsFullScreen(true);
        } else {
            document.exitFullscreen();
            setIsFullScreen(false);
        }
    };

    if (isOutletLoading || isBoardLoading) return <KdsLoader />;
    if (isOutletError || !outlet) return <KdsError onBack={() => router.back()} />;

    const board = data?.board;
    
    // Gather all active orders from all backend lanes to regroup them for the kitchen
    const allActive = [
        ...(board?.pending ?? []),
        ...(board?.processing ?? []),
        ...(board?.ready ?? []),
    ];

    // Filter out unpaid/unverified orders (AWAITING_PAYMENT)
    const paidActive = allActive.filter((o) => o.orderStatus !== "AWAITING_PAYMENT");

    // Regroup into kitchen lanes:
    // - Antrian (pending): status is CONFIRMED
    // - Dimasak (processing): status is PROCESSING or ON_GOING
    // - Siap (ready): status is READY
    const pending = paidActive.filter((o) => o.orderStatus === "CONFIRMED");
    const processing = paidActive.filter((o) => o.orderStatus === "PROCESSING" || o.orderStatus === "ON_GOING");
    const ready = paidActive.filter((o) => o.orderStatus === "READY");
    const totalActive = pending.length + processing.length + ready.length;

    const laneData = { pending, processing, ready };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
            <header className="shrink-0 bg-card border-b border-border px-5 py-3">
                <div className="flex items-center justify-between max-w-[1920px] mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-xl bg-muted border border-border flex items-center justify-center">
                            <ChefHat className="w-4.5 h-4.5 text-muted-foreground" />
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-foreground tracking-tight uppercase">
                                    Kitchen Display
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border border-border px-2 py-0.5 rounded">
                                    {outlet.name}
                                </span>
                            </div>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">
                                F&amp;B · Open Bill Mode
                            </p>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-1 bg-muted/50 border border-border rounded-xl px-4 py-2">
                        {LANES.map((lane, i) => {
                            const count = laneData[lane.key as keyof typeof laneData].length;
                            return (
                                <div key={lane.key} className="flex items-center gap-3">
                                    {i > 0 && <div className="w-px h-5 bg-border" />}
                                    <div className="flex items-center gap-2 px-2">
                                        <div className={cn("w-1.5 h-1.5 rounded-full", lane.dotClass)} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                            {lane.label}
                                        </span>
                                        <span className={cn("text-sm font-black tabular-nums", lane.labelClass)}>
                                            {count}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="w-px h-5 bg-border mx-1" />
                        <div className="px-2">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mr-2">Total</span>
                            <span className="text-sm font-black tabular-nums text-foreground">{totalActive}</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleFullScreen}
                        className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest gap-2"
                    >
                        <Monitor className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                            {isFullScreen ? "Keluar" : "Layar Penuh"}
                        </span>
                    </Button>
                </div>
            </header>

            <main className="flex-1 overflow-hidden p-4 md:p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full max-w-[1920px] mx-auto">
                    {LANES.map((lane) => (
                        <LaneColumn
                            key={lane.key}
                            lane={lane}
                            orders={laneData[lane.key as keyof typeof laneData] as any}
                        />
                    ))}
                </div>
            </main>

            <footer className="shrink-0 bg-card border-t border-border px-5 py-2.5">
                <div className="flex items-center justify-between max-w-[1920px] mx-auto">
                    <div className="flex items-center gap-2">
                        <LiveDot connected={isConnected} />
                        <span className={cn(
                            "text-[9px] font-bold uppercase tracking-widest",
                            isConnected ? "text-chart-3" : "text-muted-foreground/40"
                        )}>
                            {isConnected ? "Tersambung" : "Terputus"}
                        </span>
                        {lastUpdate && (
                            <>
                                <span className="text-border">·</span>
                                <span className="text-[9px] text-muted-foreground/40 uppercase tracking-widest">
                                    Update {lastUpdate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                </span>
                            </>
                        )}
                    </div>
                    <div className="text-[10px] font-mono font-bold text-muted-foreground tabular-nums">
                        <Clocks />
                    </div>
                </div>
            </footer>
        </div>
    );
}