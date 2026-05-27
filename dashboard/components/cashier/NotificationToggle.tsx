"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/apis/base";
import { cn } from "@/lib/utils";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getPushRegistration() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    throw new Error("Service Worker tidak didukung browser ini");
  }

  let registration = await navigator.serviceWorker.getRegistration("/");
  
  if (!registration) {
    registration = await navigator.serviceWorker.register("/sw.js");
  }

  if (registration && registration.active) {
    return registration;
  }

  // Promise.race prevents infinite hanging of navigator.serviceWorker.ready
  const readyWithTimeout = Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Service Worker belum aktif. Silakan refresh halaman atau pastikan browser Anda tidak berada dalam mode Private/Incognito.")), 8000);
    }),
  ]);

  return await readyWithTimeout;
}

interface NotificationToggleProps {
  staffId?: string;
}

export function NotificationToggle({ staffId }: NotificationToggleProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  // Fetch VAPID key dynamically from the backend
  const { data: vapidKey } = useQuery({
    queryKey: ["vapid-key"],
    queryFn: async () => {
      const res = await apiClient.get("/push-notification/vapid-key");
      return res.data.data.publicKey as string;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      getPushRegistration()
        .then((reg) => {
          reg.pushManager.getSubscription().then((sub) => {
            if (sub) {
              setIsSubscribed(true);
            }
          });
        })
        .catch(() => {
          // SW might not be ready yet, we will fallback and try again later
        });
    }
  }, []);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!vapidKey) throw new Error("Public VAPID key tidak ditemukan di backend.");
      
      const registration = await getPushRegistration();
      
      // Subscribe in the browser
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Save subscription payload in the backend
      const payload = {
        subscription: sub.toJSON(),
        staffId: staffId,
      };

      await apiClient.post("/push-notification/subscribe", payload);
      return true;
    },
    onSuccess: () => {
      setIsSubscribed(true);
      toast.success("Notifikasi kasir berhasil diaktifkan 🔔");
    },
    onError: async (err: any) => {
      setIsSubscribed(false);
      try {
        const registration = await getPushRegistration();
        const sub = await registration.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      } catch (e) {
        // ignore rollback errors
      }
      toast.error(err.response?.data?.message || err.message || "Gagal mengaktifkan notifikasi.");
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const registration = await getPushRegistration();
      const sub = await registration.pushManager.getSubscription();

      if (sub) {
        // 1. Remove from backend
        await apiClient.post("/push-notification/unsubscribe", { endpoint: sub.endpoint });
        // 2. Unsubscribe in the browser
        await sub.unsubscribe();
      }
      return false;
    },
    onSuccess: () => {
      setIsSubscribed(false);
      toast.success("Notifikasi kasir berhasil dinonaktifkan 🔕");
    },
    onError: (err: any) => {
      setIsSubscribed(true);
      toast.error(err.response?.data?.message || err.message || "Gagal menonaktifkan notifikasi.");
    },
  });

  const isProcessing = subscribeMutation.isPending || unsubscribeMutation.isPending;

  const handleToggle = async () => {
    if (isProcessing || !isSupported) return;

    if (isSubscribed) {
      unsubscribeMutation.mutate();
    } else {
      let currentPermission = Notification.permission;

      if (currentPermission === "default") {
        currentPermission = await Notification.requestPermission();
        setPermission(currentPermission);
      }

      if (currentPermission === "granted") {
        subscribeMutation.mutate();
      } else if (currentPermission === "denied") {
        toast.error("Izin notifikasi diblokir browser. Silakan aktifkan izin di pengaturan alamat browser Anda.");
      }
    }
  };

  if (!isSupported) return null;

  return (
    <Button
      onClick={handleToggle}
      disabled={isProcessing}
      variant="ghost"
      size="icon"
      className={cn(
        "relative h-8 w-8 rounded-md transition-all duration-200 hover:scale-105 active:scale-95",
        isSubscribed 
          ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20" 
          : "text-muted-foreground hover:text-foreground"
      )}
      title={isSubscribed ? "Matikan Notifikasi Kasir" : "Aktifkan Notifikasi Kasir"}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="h-4 w-4 fill-emerald-500 animate-[pulse_2s_infinite]" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
    </Button>
  );
}
