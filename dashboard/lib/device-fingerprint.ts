export function getDeviceFingerprint(): {
  screenWidth: number;
  screenHeight: number;
  timezone: string;
  language: string;
} {
  return {
    screenWidth: typeof window !== "undefined" ? window.screen.width : 0,
    screenHeight: typeof window !== "undefined" ? window.screen.height : 0,
    timezone: typeof window !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "",
    language: typeof navigator !== "undefined" ? navigator.language : "",
  };
}

export function getDeviceFingerprintHeaders(): Record<string, string> {
  const fp = getDeviceFingerprint();
  return {
    "X-Screen-Size": `${fp.screenWidth}x${fp.screenHeight}`,
    "X-Timezone": fp.timezone,
    "X-Language": fp.language,
  };
}
