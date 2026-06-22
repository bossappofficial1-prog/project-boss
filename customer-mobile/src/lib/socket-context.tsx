"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getSocket,
  SOCKET_EVENTS,
  type OrderStatusChangedPayload,
  type CustomerNotificationPayload,
} from "./socket";

type SocketContextValue = {
  isConnected: boolean;
  joinUserRoom: (userId: string) => void;
  joinOrderRoom: (orderId: string) => void;
  onOrderStatusChanged: (
    handler: (payload: OrderStatusChangedPayload) => void
  ) => () => void;
  onCustomerNotification: (
    handler: (payload: CustomerNotificationPayload) => void
  ) => () => void;
};

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let cleanup = false;

    (async () => {
      const s = await getSocket();
      if (cleanup || !s) return;

      socketRef.current = s;

      const onConnect = () => setIsConnected(true);
      const onDisconnect = () => setIsConnected(false);

      s.on("connect", onConnect);
      s.on("disconnect", onDisconnect);
      s.connect();

      return () => {
        s.off("connect", onConnect);
        s.off("disconnect", onDisconnect);
        s.disconnect();
      };
    })();

    return () => {
      cleanup = true;
    };
  }, []);

  const joinUserRoom = useCallback((userId: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.JOIN_USER, { userId });
  }, []);

  const joinOrderRoom = useCallback((orderId: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.JOIN_ORDER_UPDATE, orderId);
  }, []);

  const onOrderStatusChanged = useCallback(
    (handler: (payload: OrderStatusChangedPayload) => void) => {
      const s = socketRef.current;
      if (!s) return () => {};
      s.on(SOCKET_EVENTS.ORDER_STATUS_CHANGED, handler);
      return () => {
        s.off(SOCKET_EVENTS.ORDER_STATUS_CHANGED, handler);
      };
    },
    []
  );

  const onCustomerNotification = useCallback(
    (handler: (payload: CustomerNotificationPayload) => void) => {
      const s = socketRef.current;
      if (!s) return () => {};
      s.on(SOCKET_EVENTS.CUSTOMER_NOTIFICATION, handler);
      return () => {
        s.off(SOCKET_EVENTS.CUSTOMER_NOTIFICATION, handler);
      };
    },
    []
  );

  const value = useMemo<SocketContextValue>(
    () => ({
      isConnected,
      joinUserRoom,
      joinOrderRoom,
      onOrderStatusChanged,
      onCustomerNotification,
    }),
    [isConnected, joinUserRoom, joinOrderRoom, onOrderStatusChanged, onCustomerNotification]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}
