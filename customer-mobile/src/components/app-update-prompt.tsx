import * as Application from "expo-application";
import * as FileSystem from "expo-file-system/legacy";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";

import { useThemeColors } from "@/hooks/use-theme-colors";
import { installApk } from "@/modules/app-updater";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { Check } from "lucide-react-native";

interface UpdateInfo {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  minVersionCode: number;
  forceUpdate: boolean;
  releaseNotes: string;
}

type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "installing"
  | "latest"
  | "error";

const VERSION_JSON_URL = "https://customer.bossapp.id/version.json";
// const VERSION_JSON_URL = "http://10.14.201.211:3000/version.json";
const LS_SKIP_KEY = "boss_update_skip";
const LS_SKIP_MS = 3_600_000;
const APK_FILENAME = "boss-update.apk";

export default function AppUpdatePrompt() {
  const [state, setState] = useState<UpdateState>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const downloadedUri = useRef<string | null>(null);
  const c = useThemeColors();

  useFocusEffect(
    useCallback(() => {
      const checkSkipStatus = async () => {
        try {
          const skipUntil = await AsyncStorage.getItem(LS_SKIP_KEY);
          if (skipUntil && Date.now() < Number(skipUntil)) return;
          console.log("Checking for updates...");
          checkUpdate();
        } catch {
          checkUpdate();
        }
      };
      checkSkipStatus();
    }, []),
  );

  async function checkUpdate() {
    setState("checking");
    try {
      const res = await fetch(VERSION_JSON_URL);
      console.log("Update check response:", res);
      if (!res.ok) {
        setState("error");
        return;
      }
      const remote: UpdateInfo = await res.json();
      setUpdateInfo(remote);
      const currentVersionCode = parseInt(
        Application.nativeBuildVersion || "1",
        10,
      );
      setState(
        remote.versionCode > currentVersionCode ? "available" : "latest",
      );
    } catch (e) {
      console.error("Error checking for updates:", e);
      setState("error");
    }
  }

  async function handleSkip() {
    try {
      await AsyncStorage.setItem(LS_SKIP_KEY, String(Date.now() + LS_SKIP_MS));
    } catch {}
    setState("latest");
  }

  async function handleDownload() {
    if (!updateInfo) return;
    setState("downloading");
    setProgress(0);
    try {
      const dir = FileSystem.cacheDirectory + "app_updates/";
      const fileUri = dir + APK_FILENAME;
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
      const download = FileSystem.createDownloadResumable(
        updateInfo.apkUrl,
        fileUri,
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          setProgress(
            totalBytesExpectedToWrite
              ? Math.round(
                  (totalBytesWritten / totalBytesExpectedToWrite) * 100,
                )
              : 0,
          );
        },
      );
      const result = await download.downloadAsync();
      if (!result) {
        Alert.alert(
          "Gagal Mengunduh",
          "File update tidak ditemukan atau kosong.",
        );
        setState("available");
        return;
      }
      downloadedUri.current = result.uri;
      setState("ready");
    } catch (e) {
      console.error("Download error:", e);
      Alert.alert(
        "Gagal Mengunduh",
        "Terjadi kesalahan saat mengunduh update. Silakan periksa koneksi internet Anda dan coba lagi.",
      );
      setState("available");
    }
  }

  async function handleInstall() {
    if (!downloadedUri.current) return;
    setState("installing");
    try {
      let wentBackground = false;

      const sub = AppState.addEventListener("change", (nextState) => {
        if (nextState === "background" || nextState === "inactive") {
          wentBackground = true;
        }
        if (nextState === "active" && wentBackground) {
          sub.remove();
          const current = parseInt(Application.nativeBuildVersion || "1", 10);
          if (updateInfo && current >= updateInfo.versionCode) {
            setState("latest");
          } else {
            setState("ready");
          }
        }
      });

      await installApk(downloadedUri.current);
    } catch (e) {
      console.error("Install error:", e);
      Alert.alert(
        "Gagal Memasang",
        "Terjadi kesalahan saat memulai instalasi. Pastikan aplikasi memiliki izin untuk menginstal dari sumber tidak dikenal.",
      );
      setState("ready");
    }
  }

  if (
    state !== "available" &&
    state !== "downloading" &&
    state !== "ready" &&
    state !== "installing"
  ) {
    return null;
  }

  const markdownStyles = {
    body: { color: c.mutedForeground, fontSize: 12.5, lineHeight: 19 },
    strong: { color: c.foreground, fontWeight: "600" as const },
    paragraph: { marginBottom: 4 },
    bullet_list: { marginBottom: 2 },
    list_item: { marginBottom: 2 },
  };

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.55)",
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 340,
            borderRadius: 18,
            backgroundColor: c.card,
            padding: 20,
          }}
        >
          {state === "available" && (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: c.cardForeground,
                    letterSpacing: -0.2,
                  }}
                >
                  Update tersedia
                </Text>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 20,
                    backgroundColor: c.primary + "20",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: c.primary,
                    }}
                  >
                    v{updateInfo?.versionName}
                  </Text>
                </View>
              </View>

              {updateInfo?.releaseNotes ? (
                <View
                  style={{
                    backgroundColor: c.muted,
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 14,
                    maxHeight: 280,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color: c.mutedForeground,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                      marginBottom: 7,
                    }}
                  >
                    Yang baru
                  </Text>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ maxHeight: "auto" }}
                  >
                    <Markdown style={markdownStyles}>
                      {updateInfo.releaseNotes}
                    </Markdown>
                  </ScrollView>
                </View>
              ) : null}

              <Pressable
                onPress={handleDownload}
                style={{
                  borderRadius: 12,
                  backgroundColor: c.primary,
                  paddingVertical: 13,
                  alignItems: "center",
                  marginBottom: 8,
                  opacity: 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: c.primaryForeground,
                    letterSpacing: -0.1,
                  }}
                >
                  Download & Install
                </Text>
              </Pressable>

              {!updateInfo?.forceUpdate && (
                <Pressable
                  onPress={handleSkip}
                  style={{
                    paddingVertical: 10,
                    alignItems: "center",
                    opacity: 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "500",
                      color: c.mutedForeground,
                    }}
                  >
                    Ingatkan nanti
                  </Text>
                </Pressable>
              )}
            </>
          )}

          {state === "downloading" && (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: c.cardForeground,
                    letterSpacing: -0.2,
                  }}
                >
                  Mengunduh...
                </Text>
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: c.primary }}
                >
                  {progress}%
                </Text>
              </View>

              <View
                style={{
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: c.muted,
                  overflow: "hidden",
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    height: "100%",
                    borderRadius: 3,
                    backgroundColor: c.primary,
                    width: `${progress}%`,
                  }}
                />
              </View>

              <Text style={{ fontSize: 11.5, color: c.mutedForeground }}>
                v{updateInfo?.versionName} · Jangan tutup aplikasi
              </Text>
            </>
          )}

          {state === "ready" && (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#34c75926",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check size={15} color={"#34c759"} />
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: c.cardForeground,
                      letterSpacing: -0.2,
                    }}
                  >
                    Update siap
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: c.mutedForeground,
                      marginTop: 1,
                    }}
                  >
                    v{updateInfo?.versionName} selesai diunduh
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={handleInstall}
                style={{
                  borderRadius: 12,
                  backgroundColor: "#34c759",
                  paddingVertical: 13,
                  alignItems: "center",
                  opacity: 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#fff",
                    letterSpacing: -0.1,
                  }}
                >
                  Install sekarang
                </Text>
              </Pressable>
            </>
          )}

          {state === "installing" && (
            <View style={{ alignItems: "center", paddingVertical: 8 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: c.cardForeground,
                  letterSpacing: -0.2,
                  marginBottom: 6,
                }}
              >
                Installer sedang berjalan
              </Text>
              <Text
                style={{
                  fontSize: 12.5,
                  color: c.mutedForeground,
                  textAlign: "center",
                  lineHeight: 19,
                }}
              >
                Ikuti instruksi di layar installer Android.{"\n"}Modal ini akan
                menutup otomatis setelah selesai.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
