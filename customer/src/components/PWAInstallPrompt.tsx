"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone } from "lucide-react";
import { useStoreState } from "@/stores/use-store-state";

const APK_URL = process.env.NEXT_PUBLIC_APK_URL || "/downloads/app.apk";
const APP_LINK_URL = "https://customer.bossapp.id";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const [showApkPrompt, setShowApkPrompt] = useState(false);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  const { dismissInstallTimeout, setDismissInstallTimeout } = useStoreState();
  const isAndroidRef = useRef(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const android = /Android/i.test(ua);
    isAndroidRef.current = android;
    setIsAndroid(android);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (standalone) setIsPwaInstalled(true);
  }, []);

  useEffect(() => {
    if (!isAndroid || isPwaInstalled) return;
    if (Date.now() <= dismissInstallTimeout) return;

    const DETECT_TIMEOUT = 1500;
    let appOpened = false;

    const onVisibilityChange = () => {
      if (document.hidden) appOpened = true;
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    const tryOpen = setTimeout(() => {
      window.location.href = APP_LINK_URL;
    }, 200);

    const fallback = setTimeout(() => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (!appOpened) setShowApkPrompt(true);
    }, DETECT_TIMEOUT);

    return () => {
      clearTimeout(tryOpen);
      clearTimeout(fallback);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isAndroid, isPwaInstalled, dismissInstallTimeout]);

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isAndroidRef.current && !isPwaInstalled) {
        setShowPwaPrompt(true);
      }
    };

    const onAppInstalled = () => {
      setIsPwaInstalled(true);
      setShowPwaPrompt(false);
      setShowApkPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [isPwaInstalled]);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsPwaInstalled(true);
    }
    setDeferredPrompt(null);
    setShowPwaPrompt(false);
  };

  const handleDownloadApk = () => {
    setShowApkPrompt(false);
    const a = document.createElement("a");
    a.href = APK_URL;
    a.download = "boss.apk";
    a.click();
  };

  const handleDismiss = () => {
    setDismissInstallTimeout(Date.now() + 86400000);
    setShowPwaPrompt(false);
    setShowApkPrompt(false);
  };

  if (isPwaInstalled) return null;

  if (!isAndroid && showPwaPrompt && deferredPrompt) {
    return (
      <div
        className="fixed left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
        style={{ bottom: "calc(var(--bottomnav-height, 0px) + 1em)" }}
      >
        <div className="bg-card rounded-lg shadow-lg border border-border p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-primary rounded-lg p-2">
                <Download className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Install BOSS App
                </h3>
                <p className="text-xs text-muted-foreground">
                  Install untuk akses yang lebih cepat
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleInstallPwa} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Install
            </Button>
            <Button variant="outline" onClick={handleDismiss} className="px-4">
              Nanti
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isAndroid && showApkPrompt) {
    return (
      <div
        className="fixed left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
        style={{ bottom: "calc(var(--bottomnav-height, 0px) + 1em)" }}
      >
        <div className="bg-card rounded-lg shadow-lg border border-border p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-primary rounded-lg p-2">
                <Smartphone className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Download Aplikasi Android
                </h3>
                <p className="text-xs text-muted-foreground">
                  Dapatkan pengalaman terbaik dengan aplikasi Android BOSS
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownloadApk} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download APK
            </Button>
            <Button variant="outline" onClick={handleDismiss} className="px-4">
              Nanti
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
