import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { installApk } from "@/modules/app-updater";

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
  | "latest"
  | "error";

const VERSION_JSON_URL = "https://customer.bossapp.id/version.json";
const LS_SKIP_KEY = "boss_update_skip";
const LS_SKIP_MS = 86_400_000;
const APK_FILENAME = "boss-update.apk";

export default function AppUpdatePrompt() {
  const [state, setState] = useState<UpdateState>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const downloadedUri = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const skipUntil = localStorage.getItem(LS_SKIP_KEY);
      if (skipUntil && Date.now() < Number(skipUntil)) return;
      checkUpdate();
    }, []),
  );

  async function checkUpdate() {
    setState("checking");
    try {
      const res = await fetch(VERSION_JSON_URL);
      if (!res.ok) {
        setState("error");
        return;
      }
      const remote: UpdateInfo = await res.json();
      setUpdateInfo(remote);

      const currentVersionCode = parseInt(
        Constants.nativeBuildVersion || "1",
        10,
      );

      if (remote.versionCode > currentVersionCode) {
        setState("available");
      } else {
        setState("latest");
      }
    } catch {
      setState("error");
    }
  }

  function handleSkip() {
    const until = Date.now() + LS_SKIP_MS;
    localStorage.setItem(LS_SKIP_KEY, String(until));
    setState("latest");
  }

  async function handleDownload() {
    const info = updateInfo;
    if (!info) return;

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
        info.apkUrl,
        fileUri,
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          const pct = totalBytesExpectedToWrite
            ? Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100)
            : 0;
          setProgress(pct);
        },
      );

      const result = await download.downloadAsync();
      if (!result) {
        setState("error");
        return;
      }

      downloadedUri.current = result.uri;
      setState("ready");
      await installApk(result.uri);
    } catch {
      setState("error");
    }
  }

  async function handleInstall() {
    const uri = downloadedUri.current;
    if (!uri) return;
    try {
      await installApk(uri);
    } catch {
      setState("error");
    }
  }

  if (state !== "available" && state !== "downloading" && state !== "ready") {
    return null;
  }

  return (
    <Modal transparent animationType="fade" visible>
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <View className="w-full max-w-sm rounded-2xl bg-white p-6">
          {state === "available" && (
            <>
              <Text className="mb-1 text-center text-lg font-bold text-gray-900">
                Update Tersedia
              </Text>
              {updateInfo?.releaseNotes ? (
                <Text className="mb-4 text-center text-sm text-gray-500">
                  {updateInfo.releaseNotes}
                </Text>
              ) : null}
              <Text className="mb-6 text-center text-sm text-gray-500">
                Versi {updateInfo?.versionName} telah tersedia.
                {"\n"}Download dan install untuk pengalaman terbaik.
              </Text>
              <View className="flex-row gap-3">
                {!updateInfo?.forceUpdate && (
                  <Pressable
                    onPress={handleSkip}
                    className="flex-1 rounded-xl border border-gray-300 py-3"
                  >
                    <Text className="text-center font-semibold text-gray-600">
                      Nanti
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={handleDownload}
                  className="flex-1 rounded-xl bg-blue-600 py-3"
                >
                  <Text className="text-center font-semibold text-white">
                    Update Sekarang
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {state === "downloading" && (
            <>
              <Text className="mb-1 text-center text-lg font-bold text-gray-900">
                Mengunduh Update...
              </Text>
              <View className="my-4 h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <View
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${progress}%` }}
                />
              </View>
              <Text className="text-center text-sm text-gray-500">
                {progress}%
              </Text>
            </>
          )}

          {state === "ready" && (
            <>
              <Text className="mb-1 text-center text-lg font-bold text-gray-900">
                Update Siap
              </Text>
              <Text className="mb-6 text-center text-sm text-gray-500">
                Update telah diunduh. Install sekarang?
              </Text>
              <Pressable
                onPress={handleInstall}
                className="rounded-xl bg-blue-600 py-3"
              >
                <Text className="text-center font-semibold text-white">
                  Install
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
