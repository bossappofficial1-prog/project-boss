import { useCallback, useState, useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Alert, Platform } from "react-native";

import { subscribePush, unsubscribePush } from "../services/notification.service";
import { useProfileStore } from "@/src/stores/profile.store";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function getExpoPushToken() {
  const { expoConfig, easConfig } = await import("expo-constants").then(
    (m) => m.default
  );
  const projectId =
    easConfig?.projectId ?? expoConfig?.extra?.eas?.projectId;

  console.log("[push] projectId:", projectId);
  if (!projectId) {
    console.warn("[push] No projectId found");
    return null;
  }
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log("[push] token:", data);
    return data;
  } catch (e) {
    console.error("[push] getExpoPushToken error:", e);
    return null;
  }
}

export function usePushNotifications(guestPhone?: string, guestName?: string) {
  const [isProcessing, setIsProcessing] = useState(false);
  const isSupported = Device.isDevice;
  const expoPushToken = useProfileStore((s) => s.expoPushToken);
  const setExpoPushToken = useProfileStore((s) => s.setExpoPushToken);

  console.log("[push] isDevice:", Device.isDevice, "isSupported:", isSupported);

  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      }).catch(() => {});
    }
  }, []);

  const subscribe = useCallback(async () => {
    console.log("[push] subscribe called");
    if (!isSupported) {
      console.warn("[push] not supported");
      return;
    }
    setIsProcessing(true);

    try {
      console.log("[push] requesting permission...");
      const { status } = await Notifications.requestPermissionsAsync();
      console.log("[push] permission status:", status);

      if (status !== "granted") {
        Alert.alert(
          "Izin diperlukan",
          "Aktifkan izin notifikasi di Pengaturan > Aplikasi > BossApp > Notifikasi"
        );
        setIsProcessing(false);
        return;
      }

      let token = expoPushToken;
      if (!token) {
        console.log("[push] getting expo push token...");
        token = await getExpoPushToken();
        if (!token) {
          console.warn("[push] failed to get token");
          Alert.alert("Gagal", "Tidak bisa mendapatkan token notifikasi");
          setIsProcessing(false);
          return;
        }
        setExpoPushToken(token);
      }

      console.log("[push] subscribing to backend...");
      await subscribePush({
        expoPushToken: token,
        type: "expo",
        guestPhone,
        guestName,
      });
      console.log("[push] subscribed successfully");
    } catch (e) {
      console.error("[push] subscribe error:", e);
      Alert.alert("Gagal", "Terjadi kesalahan saat mengaktifkan notifikasi");
    } finally {
      setIsProcessing(false);
    }
  }, [guestPhone, guestName, isSupported, expoPushToken, setExpoPushToken]);

  const unsubscribe = useCallback(async () => {
    console.log("[push] unsubscribe called");
    if (!expoPushToken) {
      console.warn("[push] no token to unsubscribe");
      return;
    }
    setIsProcessing(true);

    try {
      console.log("[push] unsubscribing from backend...");
      await unsubscribePush(expoPushToken);
      setExpoPushToken(null);
      console.log("[push] unsubscribed");
    } catch (e) {
      console.error("[push] unsubscribe error:", e);
    } finally {
      setIsProcessing(false);
    }
  }, [expoPushToken, setExpoPushToken]);

  return {
    isSupported,
    isProcessing,
    subscribe,
    unsubscribe,
  };
}
