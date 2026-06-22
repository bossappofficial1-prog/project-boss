"use client";

import { useEffect, useCallback, useRef } from "react";
import { useSocket } from "@/lib/socket-context";
import type { OrderStatusChangedPayload } from "@/lib/socket";

export function useOrderSocket(orderId?: string) {
  const { isConnected, joinOrderRoom, onOrderStatusChanged } = useSocket();
  const latestHandlerRef = useRef<((payload: OrderStatusChangedPayload) => void) | null>(null);

  useEffect(() => {
    if (!orderId || !isConnected) return;
    joinOrderRoom(orderId);
  }, [orderId, isConnected, joinOrderRoom]);

  const onStatusChanged = useCallback(
    (handler: (payload: OrderStatusChangedPayload) => void) => {
      latestHandlerRef.current = handler;
      return onOrderStatusChanged((payload) => {
        if (!orderId || payload.orderId === orderId) {
          latestHandlerRef.current?.(payload);
        }
      });
    },
    [orderId, onOrderStatusChanged]
  );

  return { onStatusChanged };
}
