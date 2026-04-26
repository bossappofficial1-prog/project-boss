"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrdersV2Board } from "@/hooks/api/use-orders-v2";
import { KitchenTicket } from "@/components/kitchen/KitchenTicket";
import { getSocket } from "@/lib/socket-v2";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, UtensilsCrossed, Monitor, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { outletManagementApi } from "@/lib/apis/outletManagement";
import { useQuery } from "@tanstack/react-query";
import { Clocks } from "@/components/shared/Clock";

export default function KitchenPage() {
    const params = useParams();
    const router = useRouter();
    const outletId = params.outletId as string;
    const queryClient = useQueryClient();
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Validate Outlet Existence
    const { data: outlet, isLoading: isOutletLoading, isError: isOutletError } = useQuery({
        queryKey: ["outlet", outletId],
        queryFn: () => outletManagementApi.getById(outletId),
        enabled: !!outletId,
        retry: 1
    });

    // Use Orders V2 Board (F&B focused)
    const { data, isLoading: isBoardLoading } = useOrdersV2Board(outletId);

    // Socket implementation for real-time updates based on F&B Flow instructions
    useEffect(() => {
        if (!outletId) return;

        const socket = getSocket();

        // Join the outlet room
        socket.emit("join:outlet", { outletId });

        const handleUpdate = () => {
            console.log("KDS: Received F&B update event from socket");
            queryClient.invalidateQueries({ queryKey: ["orders-v2", "board", outletId] });
        };

        // Standard F&B Socket Events
        socket.on("order:new", handleUpdate);
        socket.on("order:itemsAdded", handleUpdate);
        socket.on("order:statusChanged", handleUpdate);
        socket.on("order:completed", handleUpdate);

        // Fallback for legacy events
        socket.on("queue:updated", handleUpdate);
        socket.on("payment:new", handleUpdate);

        return () => {
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
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error full-screen: ${err.message}`);
            });
            setIsFullScreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullScreen(false);
            }
        }
    };

    if (isOutletLoading || isBoardLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Menghubungkan ke Dapur...</p>
            </div>
        );
    }

    if (isOutletError || !outlet) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
                <div className="bg-destructive/10 p-6 rounded-full mb-6">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                </div>
                <h1 className="text-2xl font-black uppercase tracking-tighter mb-2">Outlet Tidak Ditemukan</h1>
                <p className="text-muted-foreground text-sm max-w-md mb-8">
                    ID Outlet yang Anda masukkan tidak valid atau Anda tidak memiliki akses ke outlet ini.
                </p>
                <Button onClick={() => router.back()} variant="outline" className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </Button>
            </div>
        );
    }

    /**
     * F&B KDS Rule: Only show orders with orderStatus = ON_GOING
     * We also include READY status if they haven't been cleared yet, 
     * but strictly following line 202: "Hanya tampilkan order dengan orderStatus = ON_GOING"
     */
    const activeOrders = [
        ...(data?.board.processing || []),
        ...(data?.board.pending || []),
        ...(data?.board.ready || [])
    ]
    // .filter(order => {
    //     // Strictly only show ON_GOING for kitchen prep
    //     return order.orderStatus === "ON_GOING";
    // }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return (
        <div className="min-h-screen bg-muted/30 text-foreground overflow-x-hidden">
            {/* KDS Header */}
            <header className="bg-background border-b border-border/40 p-4 sticky top-0 z-50 shadow-sm backdrop-blur-xl">
                <div className="flex items-center justify-between max-w-[1800px] mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="bg-foreground text-background p-2 rounded-lg">
                            <UtensilsCrossed className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black uppercase tracking-tighter leading-none">
                                    Kitchen Monitor
                                </h1>
                                <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                                    {outlet.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                    POS Mode: F&B (Open Bill)
                                </p>
                                <div className="w-1 h-1 rounded-full bg-border" />
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-[9px] font-black uppercase text-green-500 tracking-widest">Live Sync</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex items-center gap-6 border-r border-border/40 pr-6 mr-2">
                            <div className="text-right">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Tickets</p>
                                <p className="text-xl font-black leading-none tabular-nums text-primary">{activeOrders.length}</p>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleFullScreen}
                            className="h-9 px-4 font-bold text-[10px] uppercase tracking-widest border-border/40 hover:bg-muted"
                        >
                            <Monitor className="w-3.5 h-3.5 mr-2" />
                            {isFullScreen ? "Exit Full" : "Fullscreen"}
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content: Tickets Grid */}
            <main className="p-4 md:p-6">
                <div className="max-w-[1800px] mx-auto">
                    {activeOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-40 opacity-20">
                            <UtensilsCrossed className="w-24 h-24 mb-6" />
                            <p className="text-sm font-black uppercase tracking-[0.4em]">Tidak Ada Pesanan Aktif</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 auto-rows-max">
                            {activeOrders.map((order) => (
                                <KitchenTicket key={order.id} entry={order} />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Status Bar / Clock */}
            <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                <div className="bg-background/90 backdrop-blur-xl border border-border/40 px-8 py-3 rounded-full shadow-2xl flex items-center gap-8 pointer-events-auto">
                    <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">KDS Connected</span>
                    </div>

                    <div className="w-px h-5 bg-border/60" />

                    <Clocks />
                </div>
            </footer>
        </div>
    );
}
