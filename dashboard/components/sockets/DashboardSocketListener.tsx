'use client'

import { useSocket } from "@/hooks/useSocket"
import { useEffect, useRef } from "react";
import { useOutletContext } from "../providers/OutletProvider";
import { SOCKET_EVENT } from "@/types/socket";
import { toast } from "sonner";

export function DashboardSocketListener() {
    const notifAudioRef = useRef<HTMLAudioElement | null>(null)
    const orderAudioRef = useRef<HTMLAudioElement | null>(null)
    const { socket, isConnected } = useSocket();
    const { selectedOutletId } = useOutletContext();

    useEffect(() => {
        if (!socket && !selectedOutletId) return;
        if (!notifAudioRef.current) {
            notifAudioRef.current = new Audio('/sounds/new-order-notification.mp3');
            notifAudioRef.current.load();
        }
        if (!orderAudioRef.current) {
            orderAudioRef.current = new Audio('/sounds/order-incoming.wav');
            orderAudioRef.current.load();
        }

        const handleNotification = (payload: any) => {
            const isNewOrder = payload.message?.toLowerCase().includes('pesanan baru');
            const audio = isNewOrder ? orderAudioRef.current : notifAudioRef.current;

            toast.info(isNewOrder ? 'Order Masuk!' : 'Notifikasi', {
                description: payload.message,
                duration: Infinity,
                richColors: true,
            });
            audio?.play()
                .catch((err) => console.warn('Audio gagal diputar:', err))
        }

        socket?.emit(SOCKET_EVENT.JOIN_OUTLET, { outletId: selectedOutletId });
        socket?.on(`notification:update`, handleNotification)

        return () => {
            socket?.off('notification:update', handleNotification)
        }
    }, [selectedOutletId, isConnected, socket])

    useEffect(() => { console.log(isConnected ? 'Connnected to Socket' : 'Disconnect from Socket') }, [isConnected])

    return null
}