"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone, ExternalLink } from "lucide-react";
import { useStoreState } from "@/stores/use-store-state";

const APK_URL = process.env.NEXT_PUBLIC_APK_URL || "/downloads/app.apk";
const APP_LINK_URL = "https://customer.bossapp.id";
const ANDROID_DISMISS_KEY = "boss_android_dismiss_until";
const ANDROID_DISMISS_MS = 15 * 60 * 1000;
const DETECT_TIMEOUT_MS = 1800;

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

type AndroidState = "detecting" | "app-found" | "show-download" | "dismissed";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [androidState, setAndroidState] = useState<AndroidState>("detecting");

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

    if (standalone) {
      setIsPwaInstalled(true);
      return;
    }

    if (!android) return;

    const dismissUntil = localStorage.getItem(ANDROID_DISMISS_KEY);
    if (dismissUntil && Date.now() < Number(dismissUntil)) {
      setAndroidState("dismissed");
      return;
    }

    localStorage.removeItem(ANDROID_DISMISS_KEY);

    let appOpened = false;

    const onVisibilityChange = () => {
      if (document.hidden) {
        appOpened = true;
        setAndroidState("app-found");
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    const tryOpen = setTimeout(() => {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = `intent://${APP_LINK_URL.replace("https://", "")}#Intent;scheme=https;package=id.bossapp.customer;end`;
      document.body.appendChild(iframe);
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);

    const fallback = setTimeout(() => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (!appOpened) {
        setAndroidState("show-download");
      }
    }, DETECT_TIMEOUT_MS);

    return () => {
      clearTimeout(tryOpen);
      clearTimeout(fallback);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

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
    if (outcome === "accepted") setIsPwaInstalled(true);
    setDeferredPrompt(null);
    setShowPwaPrompt(false);
  };

  const handleDownloadApk = () => {
    const a = document.createElement("a");
    a.href = APK_URL;
    a.download = "boss.apk";
    a.click();
    handleDismissAndroid();
  };

  const handleOpenApp = () => {
    window.location.href = APP_LINK_URL;
  };

  const handleDismissAndroid = () => {
    const until = Date.now() + ANDROID_DISMISS_MS;
    localStorage.setItem(ANDROID_DISMISS_KEY, String(until));
    setAndroidState("dismissed");
  };

  const handleDismissPwa = () => {
    setDismissInstallTimeout(Date.now() + 86400000);
    setShowPwaPrompt(false);
  };

  if (isPwaInstalled) return null;

  if (!isAndroid && showPwaPrompt && deferredPrompt) {
    return (
      <PromptWrapper>
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
            <Button variant="ghost" size="sm" onClick={handleDismissPwa}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleInstallPwa} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Install
            </Button>
            <Button
              variant="outline"
              onClick={handleDismissPwa}
              className="px-4"
            >
              Nanti
            </Button>
          </div>
        </div>
      </PromptWrapper>
    );
  }

  if (isAndroid && androidState === "show-download") {
    return (
      <PromptWrapper>
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
                  Install aplikasi Android untuk pengalaman yang lebih optimal
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismissAndroid}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownloadApk} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download APK
            </Button>
            <Button
              variant="outline"
              onClick={handleDismissAndroid}
              className="px-4"
            >
              Nanti
            </Button>
          </div>
        </div>
      </PromptWrapper>
    );
  }

  if (isAndroid && androidState === "app-found") {
    return (
      <PromptWrapper>
        <div className="bg-card rounded-lg shadow-lg border border-border p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-primary rounded-lg p-2">
                <Smartphone className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Buka Aplikasi BOSS
                </h3>
                <p className="text-xs text-muted-foreground">
                  Dapatkan pengalaman terbaik dengan aplikasi Android BOSS
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismissAndroid}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleOpenApp} className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />
              Buka Aplikasi
            </Button>
            <Button
              variant="outline"
              onClick={handleDismissAndroid}
              className="px-4"
            >
              Nanti
            </Button>
          </div>
        </div>
      </PromptWrapper>
    );
  }

  return null;
}

function PromptWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      style={{ bottom: "calc(var(--bottomnav-height, 0px) + 1em)" }}
    >
      {children}
    </div>
  );
}
