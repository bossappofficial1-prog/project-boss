"use client";

import { useContext } from "react";
import { CustomerSocketEvents, SocketContext } from "@/context/SocketContext";

export function useSocket() {
    const context = useContext(SocketContext);

    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider");
    }

    const {
        socket,
        isConnected,
        emitEvent,
        onEvent,
        joinOrderRoom,
        joinCustomerRoom,
    } = context;

    return {
        socket,
        isConnected,
        emitEvent,
        onEvent,
        joinOrderRoom,
        joinCustomerRoom,
        events: CustomerSocketEvents,
    };
}