"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { apiClient } from "@/lib/apis/base";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { SetupScreenProps } from "./types";

export function SetupScreen({ prefillOutletId, onDone }: SetupScreenProps) {
  const [outletId, setOutletId] = useState(prefillOutletId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (prefillOutletId) handleVerify(prefillOutletId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async (id?: string) => {
    const targetId = (id ?? outletId).trim();
    if (!targetId) {
      setError("Outlet ID wajib diisi");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(`/outlets/${targetId}`);
      const outletData = res.data?.data;
      const outletName = outletData?.name ?? "Outlet";

      localStorage.setItem("kiosk_outletId", targetId);
      localStorage.setItem("kiosk_outletName", outletName);
      onDone({ outletId: targetId, outletName });
    } catch {
      setError(
        "Outlet ID tidak ditemukan. Pastikan ID sudah benar atau hubungi owner bisnis Anda.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHowto = () => {
    const msg =
      'Cara mendapatkan Outlet ID:\n1. Login sebagai Owner atau Manager\n2. Buka menu Laporan Absensi\n3. Klik tombol "Buka Portal Absensi"\n4. Link yang terbuka sudah berisi Outlet ID secara otomatis';
    navigator.clipboard.writeText(msg).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="rounded-xl py-4 border border-border shadow-sm">
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Konfigurasi Kiosk Absensi
                </h1>
                <p className="text-xs text-muted-foreground">
                  Cukup diatur sekali, data disimpan di perangkat ini
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Outlet ID <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Contoh: 550e8400-e29b-41d4-a716-446655440000"
                value={outletId}
                onChange={(e) => {
                  setOutletId(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="font-mono"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <Button
              onClick={() => handleVerify()}
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Memverifikasi outlet..." : "Mulai Portal Absensi"}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-xl py-0 border border-border bg-muted/30">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cara mendapatkan Outlet ID
            </p>
            <ol className="space-y-2">
              {[
                "Login sebagai Owner atau Manager di dashboard",
                "Buka menu Laporan Absensi",
                <>
                  Klik tombol{" "}
                  <span className="font-semibold text-foreground">
                    &quot;Buka Portal Absensi&quot;
                  </span>{" "}
                  link yang terbuka sudah berisi Outlet ID otomatis
                </>,
                "Buka link tersebut di perangkat kiosk (tablet/komputer konter)",
              ].map((step, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-xs text-muted-foreground"
                >
                  <span className="shrink-0 w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <button
              onClick={handleCopyHowto}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? (
                <Check className="w-3 h-3 text-primary" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copied ? "Tersalin!" : "Salin panduan ini"}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
