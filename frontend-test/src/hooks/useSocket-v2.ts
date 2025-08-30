"use client";

import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export function useSocket(orderId?: string) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // 1. Efek untuk koneksi utama (hanya berjalan sekali)
    useEffect(() => {
        const socketInstance = io(SOCKET_URL, {
            transports: ["websocket"],
            reconnectionAttempts: 5,
        });

        socketInstance.on("connect", () => {
            setIsConnected(true);
            console.log("🔌 Connected to socket server");
        });

        socketInstance.on("disconnect", () => {
            setIsConnected(false);
            console.log("❌ Disconnected from socket server");
        });

        setSocket(socketInstance);

        // Cleanup saat komponen di-unmount
        return () => {
            socketInstance.disconnect();
        };
    }, []); // <-- Dependency array kosong agar hanya berjalan sekali

    // 2. Efek untuk join room (berjalan saat socket terhubung atau orderId berubah)
    useEffect(() => {
        if (socket && orderId) {
            socket.emit("joinOrderRoom", orderId);
        }
    }, [socket, orderId]);

    // 3. Stabilkan fungsi dengan useCallback
    const emitEvent = useCallback((event: string, data: any) => {
        socket?.emit(event, data);
    }, [socket]);

    // 4. Sediakan fungsi cleanup untuk event listener
    const onEvent = useCallback((event: string, callback: (data: any) => void) => {
        socket?.on(event, callback);

        return () => {
            socket?.off(event, callback);
        };
    }, [socket]);

    return {
        socket,
        isConnected,
        emitEvent,
        onEvent,
    };
}