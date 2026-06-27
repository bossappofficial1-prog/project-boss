import { requireNativeModule } from "expo-modules-core";

interface AppUpdaterNative {
  installApk(absolutePath: string): Promise<void>;
}

const native = requireNativeModule<AppUpdaterNative>("AppUpdater");

export function installApk(absolutePath: string): Promise<void> {
  return native.installApk(absolutePath);
}
