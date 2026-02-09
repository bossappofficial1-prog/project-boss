'use client'

import { getSocket } from "@/lib/socket-v2"
import { formatCurrency } from "@/lib/utils"
import { ShoppingBag, User, CreditCard, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import React, { createContext, useContext, useEffect, useRef, useState } from "react"
import { Socket } from "socket.io-client"
import { toast } from "sonner"

const SocketCashierContext = createContext<Socket | null>(null)

export const SocketCashierProvider = ({
    children,
    outletId
}: { children: React.ReactNode, outletId: string }) => {
    const [socket, setSocket] = useState<Socket | null>(null)
    const notifAudioRef = useRef<HTMLAudioElement | null>(null)
    const router = useRouter()

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

        socket.emit("cashier:join", outletId);
        socket.on("orderEvent", joinOutlet);

        return () => {
            socket.off("orderEvent");
        };
    }, [socket, outletId])

    return (
        <SocketCashierContext value={socket}>
            {children}
        </SocketCashierContext>
    )
}

export const useSocket = () => {
    const socket = useContext(SocketCashierContext);
    if (!socket) {
        throw new Error("useSocket harus digunakan di dalam SocketProvider");
    }
    return socket;
};