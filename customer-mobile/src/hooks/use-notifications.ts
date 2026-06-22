"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useSocket } from "@/lib/socket-context";
import type { CustomerNotificationPayload } from "@/lib/socket";
import { useProfileStore } from "@/src/stores/profile.store";

export type MobileNotification = {
  id: string;
  orderId: string;
  title: string;
  message: string;
  type: string;
  timestamp: number;
  read: boolean;
};

export function useNotifications() {
  const { isConnected, joinUserRoom, onCustomerNotification } = useSocket();
  const phone = useProfileStore((s) => s.phone);
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const latestHandlerRef = useRef<((n: MobileNotification) => void) | null>(null);

  useEffect(() => {
    if (!phone || !isConnected) return;
    joinUserRoom(phone);
  }, [phone, isConnected, joinUserRoom]);

  const addNotification = useCallback((payload: CustomerNotificationPayload) => {
    const notif: MobileNotification = {
      id: `${payload.orderId}-${Date.now()}`,
      orderId: payload.orderId,
      title: payload.type === "payment_success" ? "Pembayaran Berhasil" : "Status Diperbarui",
      message: payload.message || `Pesanan #${payload.orderId.slice(0, 8)} telah diperbarui`,
      type: payload.type || payload.status,
      timestamp: Date.now(),
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
    latestHandlerRef.current?.(notif);
  }, []);

  useEffect(() => {
    if (!isConnected) return;
    return onCustomerNotification(addNotification);
  }, [isConnected, onCustomerNotification, addNotification]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const onNewNotification = useCallback(
    (handler: (notif: MobileNotification) => void) => {
      latestHandlerRef.current = handler;
    },
    []
  );

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
    onNewNotification,
  };
}
