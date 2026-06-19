"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Clock, X } from "lucide-react";
import { useAuth } from "@/features/auth";
import { useRouter } from "next/navigation";

const DISMISS_KEY = "2fa-reminder-dismissed";
const DISMISS_DURATION_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

export function TwoFactorReminder() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const is2faEnabled = (user as any)?.twoFactorEnabled ?? false;

  useEffect(() => {
    if (is2faEnabled) return;

    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const elapsed = Date.now() - Number(dismissedAt);
        if (elapsed < DISMISS_DURATION_MS) return;
      }
    } catch {}

    const timer = setTimeout(() => setOpen(true), 3000);
    return () => clearTimeout(timer);
  }, [is2faEnabled]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setOpen(false);
  };

  const handleEnable = () => {
    handleDismiss();
    router.push("/owner/settings");
  };

  if (is2faEnabled) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Aktifkan Autentikasi Dua Faktor
          </DialogTitle>
          <DialogDescription>
            Lindungi akun Anda dengan lapisan keamanan ekstra. Setiap login akan
            memerlukkan kode dari aplikasi authenticator.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Tanpa 2FA, akun Anda hanya dilindungi oleh kata sandi. Aktifkan
            sekarang untuk keamanan yang lebih baik.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            Nanti Saja
          </Button>
          <Button size="sm" onClick={handleEnable}>
            <ShieldCheck className="w-4 h-4 mr-1" />
            Aktifkan Sekarang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
