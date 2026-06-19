"use client";

import { getSocket } from "@/lib/socket-v2";
import { formatCurrency } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Socket } from "socket.io-client";
import { gooeyToast } from "goey-toast";
import { SOCKET_EVENT, type SocketEvents } from "@/types/socket";

const SocketCashierContext = createContext<Socket | null>(null);

const speakText = (text: string) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "id-ID";

  const setVoiceAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    const indonesianVoice = voices.find(
      (v) =>
        v.lang.includes("id") || v.name.toLowerCase().includes("indonesia"),
    );
    if (indonesianVoice) utterance.voice = indonesianVoice;
    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length) {
    setVoiceAndSpeak();
  } else {
    window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
  }
};

export const SocketCashierProvider = ({
  children,
  outletId,
}: {
  children: React.ReactNode;
  outletId: string;
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const notifAudioRef = useRef<HTMLAudioElement | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    setSocket(getSocket());
  }, []);

  useEffect(() => {
    if (!socket || !outletId) return;

    const handleConnect = () => {
      socket.emit("cashier:join", outletId);
      socket.emit(SOCKET_EVENT.JOIN_OUTLET, { outletId });
    };

    const handleOrderEvent = (payload: any) => {
      qc.invalidateQueries({ queryKey: ["badge-count", outletId] });
      qc.invalidateQueries({ queryKey: ["orders-v2"] });
      qc.invalidateQueries({ queryKey: ["queue-v2"] });

      if (!notifAudioRef.current) {
        notifAudioRef.current = new Audio("/sounds/order-incoming.wav");
        notifAudioRef.current.load();
      }

      const audio = notifAudioRef.current;
      const itemsName = payload.itemsDescription || "Produk";
      const verbalAmount = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(payload.amount);

      audio.onended = () =>
        speakText(
          `Bukti pembayaran baru telah dikirim: ${itemsName}, senilai ${verbalAmount}`,
        );
      audio.play().catch((err) => {
        console.warn("Audio gagal diputar:", err);
        speakText(
          `Bukti pembayaran baru telah dikirim: ${itemsName}, senilai ${verbalAmount}`,
        );
      });
    };

    const handlePaymentNew = (
      payload: SocketEvents[typeof SOCKET_EVENT.PAYMENT_NEW],
    ) => {
      if (!payload) return;
      qc.invalidateQueries({ queryKey: ["orders-v2"] });
      qc.invalidateQueries({ queryKey: ["queue-v2"] });
      gooeyToast.info(`Pembayaran baru: ${payload.customerName}`, {
        description: `${formatCurrency(payload.amount)} via ${payload.paymentMethod?.replace(/_/g, " ")}`,
      });
    };

    const handleOrderStatusChanged = () => {
      qc.invalidateQueries({ queryKey: ["queue-v2"] });
      qc.invalidateQueries({ queryKey: ["orders-v2"] });
    };

    if (socket.connected) handleConnect();

    socket.on("connect", handleConnect);
    socket.on("orderEvent", handleOrderEvent);
    socket.on(SOCKET_EVENT.PAYMENT_NEW, handlePaymentNew);
    socket.on(SOCKET_EVENT.ORDER_STATUS_CHANGED, handleOrderStatusChanged);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("orderEvent", handleOrderEvent);
      socket.off(SOCKET_EVENT.PAYMENT_NEW, handlePaymentNew);
      socket.off(SOCKET_EVENT.ORDER_STATUS_CHANGED, handleOrderStatusChanged);
    };
  }, [socket, outletId, qc]);

  return (
    <SocketCashierContext.Provider value={socket}>
      {children}
    </SocketCashierContext.Provider>
  );
};

export const useSocket = () => {
  const socket = useContext(SocketCashierContext);
  if (!socket) {
    throw new Error("useSocket harus digunakan di dalam SocketProvider");
  }
  return socket;
};
