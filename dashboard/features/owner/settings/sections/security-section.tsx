"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, KeyRound } from "lucide-react";
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
          Kelola keamanan akun Anda.
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

      <AuthenticatorSection provider={provider} />
      <SessionsSection />
    </div>
  );
}
