'use client'

import { useSocket } from "@/hooks/useSocket"
import { useEffect, useRef } from "react";
import { useOutletContext } from "../providers/OutletProvider";
import { SOCKET_EVENT } from "@/types/socket";
import { toast } from "sonner";

export function DashboardSocketListener() {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const { socket, isConnected } = useSocket();
    const { selectedOutletId } = useOutletContext();

    useEffect(() => {
        if (!socket && !selectedOutletId) return;
        if (!audioRef.current) {
            audioRef.current = new Audio('/sounds/new-order-notification.mp3');
            audioRef.current.load();
        }

        const handleNotification = (payload: any) => {
            toast.info('Notifikasi', { description: payload.message, duration: Infinity, richColors: true });
            audioRef.current?.play()
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