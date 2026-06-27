import { useCallback, useMemo } from "react";
import {
  Alert,
  InteractionManager,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTheme } from "@/components/ThemeProvider";
import { useSnackbar } from "@/components/ui/snackbar";
import { NotificationButton } from "@/src/features/notifications";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { useProfileStore } from "@/src/stores/profile.store";
import {
  Bookmark,
  ChevronRight,
  Heart,
  Monitor,
  Moon,
  Phone,
  Receipt,
  RotateCcw,
  Save,
  Sun,
  User as UserIcon,
} from "lucide-react-native";

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function SectionLabel({
  children,
  c,
}: {
  children: string;
  c: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: "700",
        color: c.mutedForeground,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 10,
      }}
    >
      {children}
    </Text>
  );
}

export default function ProfileScreen() {
  const c = useThemeColors();
  const { setColorScheme, resetColorScheme } = useTheme();
  const snackbar = useSnackbar();
  const { fullName, phone, theme, setFullName, setPhone, setTheme, reset } =
    useProfileStore();

  const profileCompleteness = useMemo(() => {
    let completed = 0;
    if (fullName && fullName.length >= 2) completed++;
    if (phone && phone.length >= 6) completed++;
    if (theme) completed++;
    return Math.round((completed / 3) * 100);
  }, [fullName, phone, theme]);

  const handleSave = useCallback(() => {
    snackbar.success("Preferensi berhasil disimpan.");
  }, [snackbar]);

  const handleReset = useCallback(() => {
    Alert.alert(
      "Atur Ulang Pengaturan",
      "Apakah Anda yakin ingin mengatur ulang semua pengaturan? Tindakan ini tidak dapat dibatalkan.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Konfirmasi",
          style: "destructive",
          onPress: () => {
            reset();
            resetColorScheme();
          },
        },
      ],
    );
  }, [reset, resetColorScheme]);

  const themeOptions = [
    { value: "light" as const, icon: Sun, label: "Terang" },
    { value: "dark" as const, icon: Moon, label: "Gelap" },
    { value: "system" as const, icon: Monitor, label: "Sistem" },
  ];

  const quickLinks = [
    {
      icon: Receipt,
      label: "Pesanan Saya",
      subtitle: "Lihat semua pesanan",
      onPress: () => {},
    },
    {
      icon: Heart,
      label: "Favorit Saya",
      subtitle: "Outlet tersimpan",
      badge: 0,
      onPress: () => {},
    },
    {
      icon: Bookmark,
      label: "Produk Tersimpan",
      subtitle: "Produk & layanan",
      badge: 0,
      onPress: () => {},
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View
          style={{
            paddingTop: 20,
            paddingHorizontal: 20,
            paddingBottom: 24,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: c.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: c.primaryForeground,
              }}
            >
              {getInitials(fullName || "U")}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 17, fontWeight: "700", color: c.foreground }}
              numberOfLines={1}
            >
              {fullName || "Masukkan nama lengkap"}
            </Text>
            <Text
              style={{ fontSize: 13, color: c.mutedForeground, marginTop: 2 }}
            >
              {phone || "+62 812 3456 7890"}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginTop: 8,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: c.muted,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${profileCompleteness}%`,
                    height: "100%",
                    backgroundColor: c.primary,
                    borderRadius: 2,
                  }}
                />
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: c.mutedForeground,
                }}
              >
                {profileCompleteness}%
              </Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 24 }}>
          {/* Quick Links */}
          <View
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.background,
              overflow: "hidden",
            }}
          >
            {quickLinks.map((link, i) => (
              <Pressable
                key={link.label}
                onPress={link.onPress}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderBottomWidth: i < quickLinks.length - 1 ? 1 : 0,
                  borderBottomColor: c.border,
                }}
              >
                <link.icon size={18} color={c.mutedForeground} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: c.foreground,
                    }}
                  >
                    {link.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: c.mutedForeground,
                      marginTop: 1,
                    }}
                  >
                    {link.subtitle}
                  </Text>
                </View>
                {link.badge != null && link.badge > 0 && (
                  <View
                    style={{
                      minWidth: 20,
                      height: 20,
                      paddingHorizontal: 6,
                      borderRadius: 10,
                      backgroundColor: c.muted,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: c.mutedForeground,
                      }}
                    >
                      {link.badge > 99 ? "99+" : link.badge}
                    </Text>
                  </View>
                )}
                <ChevronRight
                  size={16}
                  color={c.mutedForeground}
                  opacity={0.5}
                />
              </Pressable>
            ))}
          </View>

          {/* Notification */}
          <View>
            <SectionLabel c={c}>Notifikasi</SectionLabel>
            <View
              style={{
                borderRadius: 14,
                borderWidth: 1,
                borderColor: c.border,
                overflow: "hidden",
              }}
            >
              <NotificationButton />
            </View>
          </View>

          {/* Contact Info */}
          <View>
            <SectionLabel c={c}>Informasi Kontak</SectionLabel>
            <View style={{ gap: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingHorizontal: 14,
                  height: 48,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <UserIcon size={16} color={c.mutedForeground} />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Nama lengkap"
                  placeholderTextColor={c.mutedForeground}
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: c.foreground,
                    padding: 0,
                  }}
                />
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingHorizontal: 14,
                  height: 48,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <Phone size={16} color={c.mutedForeground} />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+62 812 3456 7890"
                  placeholderTextColor={c.mutedForeground}
                  keyboardType="phone-pad"
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: c.foreground,
                    padding: 0,
                  }}
                />
              </View>
            </View>
          </View>

          {/* Appearance */}
          <View>
            <SectionLabel c={c}>Tampilan</SectionLabel>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {themeOptions.map(({ value, icon: Icon, label }) => {
                const active = theme === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => {
                      setTheme(value);
                      InteractionManager.runAfterInteractions(() => {
                        if (value === "system") {
                          resetColorScheme();
                        } else {
                          setColorScheme(value);
                        }
                      });
                    }}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: active ? c.primary : c.border,
                    }}
                  >
                    <Icon
                      size={15}
                      color={active ? c.primary : c.mutedForeground}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: active ? c.primary : c.mutedForeground,
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Actions */}
          <View style={{ gap: 10 }}>
            <Pressable
              onPress={handleSave}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                height: 48,
                borderRadius: 12,
                backgroundColor: c.primary,
              }}
            >
              <Save size={17} color={c.primaryForeground} />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: c.primaryForeground,
                }}
              >
                Simpan Perubahan
              </Text>
            </Pressable>

            <Pressable
              onPress={handleReset}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 44,
                borderRadius: 12,
              }}
            >
              <RotateCcw size={14} color={c.mutedForeground} />
              <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                Atur Ulang Pengaturan
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
