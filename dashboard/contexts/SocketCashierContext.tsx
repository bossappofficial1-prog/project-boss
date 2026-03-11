'use client'

import { getSocket } from "@/lib/socket-v2"
import { formatCurrency } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { ShoppingBag, User, CreditCard, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import React, { createContext, useContext, useEffect, useRef, useState } from "react"
import { Socket } from "socket.io-client"
import { toast } from "sonner"
import { SOCKET_EVENT, type SocketEvents } from "@/types/socket"

const SocketCashierContext = createContext<Socket | null>(null)

export const SocketCashierProvider = ({
    children,
    outletId
}: { children: React.ReactNode, outletId: string }) => {
    const [socket, setSocket] = useState<Socket | null>(null)
    const notifAudioRef = useRef<HTMLAudioElement | null>(null)
    const router = useRouter()
    const qc = useQueryClient()

    useEffect(() => {
        const socketInstance = getSocket();
        setSocket(socketInstance);
    }, []);

    useEffect(() => {
        if (!socket || !outletId) return;

        const joinOutlet = (payload: any) => {
            if (!socket && !outletId) return;
            if (!notifAudioRef.current) {
                notifAudioRef.current = new Audio('/sounds/order-incoming.wav');
                notifAudioRef.current.load();
            }
            qc.invalidateQueries({ queryKey: ['badge-count', outletId] });

            toast.success("Order Masuk", {
                description: (
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/40">
                            <ShoppingBag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="font-semibold text-sm">{payload.customerName}</span>
                            </div>
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(payload.amount)}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <CreditCard className="h-3 w-3" />
                                <span>{payload.paymentMethod?.replace(/_/g, " ")}</span>
                                <span className="mx-1">·</span>
                                <span className="font-mono">{payload.orderId?.slice(-8)}</span>
                            </div>
                        </div>
                    </div>
                ),
                action: {
                    label: (
                        <span className="flex items-center gap-1">
                            Lihat <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                    ) as unknown as string,
                    onClick: () => router.push("/cashier/orders"),
                },
                duration: 8000,
            });

            notifAudioRef.current.play()
                .catch((err) => console.warn('Audio gagal diputar:', err))
        };

        const handleConnect = () => {
            console.log(`[SocketCashier] Connected/Reconnected for outlet: ${outletId}`);
            // Re-join the outlet room upon every successful connection
            socket.emit("cashier:join", outletId);
            socket.emit(SOCKET_EVENT.JOIN_OUTLET, { outletId });
        };

        // If the socket is somehow already connected when this runs, join immediately
        if (socket.connected) {
            handleConnect();
        }

        socket.on("connect", handleConnect);
        socket.on("orderEvent", joinOutlet);

        const handlePaymentNew = (payload: SocketEvents[typeof SOCKET_EVENT.PAYMENT_NEW]) => {
            if (!payload) return;
            qc.invalidateQueries({ queryKey: ['orders-v2'] });
            qc.invalidateQueries({ queryKey: ['queue-v2'] });
            toast.info(`Pembayaran baru: ${payload.customerName}`, {
                description: `${formatCurrency(payload.amount)} via ${payload.paymentMethod?.replace(/_/g, ' ')}`,
            });
        };

        const handleOrderStatusChanged = () => {
            qc.invalidateQueries({ queryKey: ['queue-v2'] });
            qc.invalidateQueries({ queryKey: ['orders-v2'] });
        };

        socket.on(SOCKET_EVENT.PAYMENT_NEW, handlePaymentNew);
        socket.on(SOCKET_EVENT.ORDER_STATUS_CHANGED, handleOrderStatusChanged);

        return () => {
            socket.off("connect", handleConnect);
            socket.off("orderEvent", joinOutlet);
            socket.off(SOCKET_EVENT.PAYMENT_NEW, handlePaymentNew);
            socket.off(SOCKET_EVENT.ORDER_STATUS_CHANGED, handleOrderStatusChanged);
        };
    }, [socket, outletId, qc])

    return (
        <SocketCashierContext.Provider value={socket}>
            {children}
        </SocketCashierContext.Provider>
    )
}

export const useSocket = () => {
    const socket = useContext(SocketCashierContext);
    if (!socket) {
        throw new Error("useSocket harus digunakan di dalam SocketProvider");
    }
    return socket;
};