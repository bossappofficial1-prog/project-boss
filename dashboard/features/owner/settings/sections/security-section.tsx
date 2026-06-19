"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, KeyRound, AlertTriangle } from "lucide-react";
import { PasswordForm } from "../password-form";
import { SessionsSection } from "./sessions-section";
import { AuthenticatorSection } from "./authenticator-section";

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

      <AuthenticatorSection />
      <SessionsSection />
    </div>
  );
}
