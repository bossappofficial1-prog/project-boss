import * as Notifications from "expo-notifications";
import { Pressable, Switch, Text, View } from "react-native";

import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { useProfileStore } from "@/src/stores/profile.store";
import { usePushNotifications } from "../hooks/use-push-notifications";

export function NotificationButton() {
  const c = useThemeColors();
  const isDev =
    process.env.APP_ENV == "development" ||
    process.env.EXPO_PUBLIC_APP_ENV == "development";
  const { phone, fullName, notifEnabled, setNotifEnabled } = useProfileStore();
  const { isSupported, isProcessing, subscribe, unsubscribe } =
    usePushNotifications(phone || undefined, fullName || undefined);

  async function handleToggle(value: boolean) {
    if (value) {
      setNotifEnabled(true);
      await subscribe();
    } else {
      setNotifEnabled(false);
      await unsubscribe();
    }
  }

  async function handleTest() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Notifikasi Berhasil! 🎉",
        body: "Push notification berfungsi dengan baik di perangkat Anda.",
        data: { url: "/" },
      },
      trigger: null,
    });
  }

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 14,
          paddingHorizontal: 16,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 14, fontWeight: "600", color: c.foreground }}
          >
            Notifikasi Push
          </Text>
          <Text
            style={{ fontSize: 12, color: c.mutedForeground, marginTop: 1 }}
          >
            {!isSupported
              ? "Tidak didukung di perangkat ini"
              : notifEnabled
                ? "Notifikasi aktif"
                : "Terima notifikasi pesanan & promo"}
          </Text>
        </View>
        <Switch
          value={notifEnabled}
          onValueChange={handleToggle}
          disabled={!isSupported || isProcessing}
          trackColor={{ false: c.muted, true: c.primary }}
          thumbColor={c.background}
        />
      </View>

      {notifEnabled && isDev && (
        <Pressable
          onPress={handleTest}
          style={{
            marginHorizontal: 16,
            marginBottom: 12,
            paddingVertical: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: c.border,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 13, color: c.mutedForeground }}>
            Kirim Notifikasi Uji Coba
          </Text>
        </Pressable>
      )}
    </View>
  );
}
