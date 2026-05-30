"use client";

import { getSocket } from "@/lib/socket-v2";
import { formatCurrency } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingBag, User, CreditCard, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Socket } from "socket.io-client";
import { toast } from "sonner";
import { SOCKET_EVENT, type SocketEvents } from "@/types/socket";

const SocketCashierContext = createContext<Socket | null>(null);

export const SocketCashierProvider = ({
  children,
  outletId,
}: {
  children: React.ReactNode;
  outletId: string;
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const notifAudioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    const socketInstance = getSocket();
    setSocket(socketInstance);
  }, []);

  useEffect(() => {
    if (!socket || !outletId) return;

    const joinOutlet = (payload: any) => {
      if (!socket && !outletId) return;
      if (!notifAudioRef.current) {
        notifAudioRef.current = new Audio("/sounds/order-incoming.wav");
        notifAudioRef.current.load();
      }
      qc.invalidateQueries({ queryKey: ["badge-count", outletId] });

      notifAudioRef.current
        .play()
        .catch((err) => console.warn("Audio gagal diputar:", err));

      // Text-to-Speech verbal announcement
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const itemsName = payload.itemsDescription || "Produk";

        // Format the currency amount verbally in Indonesian
        const verbalAmount = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(payload.amount);

        const verbalText = `Ada pesanan masuk, ${itemsName}, senilai ${verbalAmount}`;

        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(verbalText);
          utterance.lang = "id-ID";

          // Search for Indonesian voice
          const voices = window.speechSynthesis.getVoices();
          const indonesianVoice = voices.find(
            (voice) =>
              voice.lang.includes("id") ||
              voice.name.toLowerCase().includes("indonesia"),
          );
          if (indonesianVoice) {
            utterance.voice = indonesianVoice;
          }

          window.speechSynthesis.speak(utterance);
        }, 800);
      }
    };

    const handleConnect = () => {
      console.log(
        `[SocketCashier] Connected/Reconnected for outlet: ${outletId}`,
      );
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

    const handlePaymentNew = (
      payload: SocketEvents[typeof SOCKET_EVENT.PAYMENT_NEW],
    ) => {
      if (!payload) return;
      qc.invalidateQueries({ queryKey: ["orders-v2"] });
      qc.invalidateQueries({ queryKey: ["queue-v2"] });
      toast.info(`Pembayaran baru: ${payload.customerName}`, {
        description: `${formatCurrency(payload.amount)} via ${payload.paymentMethod?.replace(/_/g, " ")}`,
      });
    };

    const handleOrderStatusChanged = () => {
      qc.invalidateQueries({ queryKey: ["queue-v2"] });
      qc.invalidateQueries({ queryKey: ["orders-v2"] });
    };

    socket.on(SOCKET_EVENT.PAYMENT_NEW, handlePaymentNew);
    socket.on(SOCKET_EVENT.ORDER_STATUS_CHANGED, handleOrderStatusChanged);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("orderEvent", joinOutlet);
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
