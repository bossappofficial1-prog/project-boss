"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, KeyRound, Monitor, AlertTriangle } from "lucide-react";
import { PasswordForm } from "../password-form";

interface SecuritySectionProps {
  userId: string;
  provider?: string;
}

export function SecuritySection({ userId, provider }: SecuritySectionProps) {
  const isLocalAuth = provider === "local";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Keamanan Akun
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Lindungi akun Anda dengan kata sandi yang kuat.
        </p>
      </div>

      {isLocalAuth && (
        <Card className="shadow-sm gap-0 border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-muted-foreground" />
              Ubah Kata Sandi
            </CardTitle>
            <CardDescription>
              Gunakan kata sandi yang kuat dan unik. Minimal 8 karakter.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm
              userId={userId}
              defaultValues={{
                confirmPassword: "",
                currentPassword: "",
                newPassword: "",
              }}
            />
          </CardContent>
        </Card>
      )}

      {!isLocalAuth && (
        <Card className="shadow-sm gap-0 border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40">
              <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Login via Google
                </p>
                <p className="text-xs text-blue-700/70 dark:text-blue-400/70 mt-1">
                  Anda masuk menggunakan akun Google. Kata sandi dikelola oleh
                  Google. Untuk mengubah kata sandi, silakan melalui pengaturan
                  akun Google Anda.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm gap-0 border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor className="w-4 h-4 text-muted-foreground" />
            Sesi Login Aktif
          </CardTitle>
          <CardDescription>
            Kelola perangkat yang terhubung ke akun Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/60 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium">Perangkat Ini</p>
                <p className="text-xs text-muted-foreground">
                  Sesi aktif saat ini
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-emerald-600 border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-[10px] font-bold uppercase tracking-wider"
            >
              Aktif
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 text-center">
            Fitur manajemen sesi akan segera tersedia.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
