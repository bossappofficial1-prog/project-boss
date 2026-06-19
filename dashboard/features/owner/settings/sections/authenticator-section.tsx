"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  KeyRound,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Eye,
  EyeOff,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { securityApi } from "@/features/auth/services/security";
import { gooeyToast } from "goey-toast";
import Image from "next/image";

export function AuthenticatorSection({ provider }: { provider?: string }) {
  const queryClient = useQueryClient();
  const isGoogleAuth = provider === "google";
  const [step, setStep] = useState<"idle" | "setup" | "verify" | "codes">(
    "idle",
  );
  const [verificationCode, setVerificationCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [codesCopied, setCodesCopied] = useState(false);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ["2fa-status"],
    queryFn: () => securityApi.get2faStatus(),
  });

  const isEnabled = statusData?.enabled ?? false;

  const setupMutation = useMutation({
    mutationFn: () => securityApi.generate2faSetup(),
    onSuccess: (res: any) => {
      setQrCode(res?.qrCode ?? "");
      setSecret(res?.secret ?? "");
      setStep("verify");
      gooeyToast.success("Scan QR code dengan aplikasi authenticator");
    },
    onError: (err: any) => {
      gooeyToast.error(
        err?.response?.data?.message ?? "Gagal memulai setup 2FA",
      );
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (token: string) => securityApi.verifyAndEnable2fa(token),
    onSuccess: (res: any) => {
      setBackupCodes(res?.backupCodes ?? []);
      setStep("codes");
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
    },
    onError: (err: any) => {
      gooeyToast.error(
        err?.response?.data?.message ?? "Kode verifikasi tidak valid",
      );
    },
  });

  const disableMutation = useMutation({
    mutationFn: ({ password, token }: { password?: string; token?: string }) =>
      securityApi.disable2fa(password, token),
    onSuccess: () => {
      gooeyToast.success("2FA berhasil dinonaktifkan");
      setStep("idle");
      setDisablePassword("");
      setDisableCode("");
      setQrCode("");
      setSecret("");
      setBackupCodes([]);
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
    },
    onError: (err: any) => {
      gooeyToast.error(
        err?.response?.data?.message ?? "Gagal menonaktifkan 2FA",
      );
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: ({ password, token }: { password?: string; token?: string }) =>
      securityApi.regenerateBackupCodes(password, token),
    onSuccess: (res: any) => {
      setBackupCodes(res?.backupCodes ?? []);
      gooeyToast.success("Kode cadangan baru berhasil dibuat");
    },
    onError: (err: any) => {
      gooeyToast.error(
        err?.response?.data?.message ?? "Gagal membuat kode cadangan",
      );
    },
  });

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCodesCopied(true);
    setTimeout(() => setCodesCopied(false), 2000);
    gooeyToast.success("Kode cadangan disalin");
  };

  const handleDownloadCodes = () => {
    const text = backupCodes.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const isVerifying = verifyMutation.isPending;
  const isDisabling = disableMutation.isPending;

  if (statusLoading) {
    return (
      <Card className="shadow-sm gap-0 border-border/60">
        <CardContent className="pt-6">
          <div className="h-20 rounded-lg bg-muted/30 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (isEnabled) {
    return (
      <Card className="shadow-sm gap-0 border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Autentikasi Dua Faktor (2FA)
          </CardTitle>
          <CardDescription>
            Akun Anda dilindungi dengan autentikasi dua faktor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                2FA Aktif
              </p>
              <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70 mt-1">
                Setiap login memerlukan kode dari aplikasi authenticator.
              </p>
            </div>
          </div>

          {step === "codes" && backupCodes.length > 0 && (
            <div className="mb-4 p-4 rounded-lg border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Kode Cadangan 2FA
                  </p>
                  <p className="text-xs text-amber-700/70 dark:text-amber-400/70">
                    Simpan kode ini di tempat aman. Setiap kode hanya bisa
                    digunakan sekali.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="font-mono text-sm grid grid-cols-2 gap-2 mb-3">
                  {backupCodes.map((code, i) => (
                    <code
                      key={i}
                      className={`p-2 rounded bg-background text-center text-xs ${!showBackupCodes ? "blur-sm select-none" : ""}`}
                    >
                      {showBackupCodes ? code : "••••••••••"}
                    </code>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setShowBackupCodes(!showBackupCodes)}
                  >
                    {showBackupCodes ? (
                      <EyeOff className="w-3 h-3 mr-1" />
                    ) : (
                      <Eye className="w-3 h-3 mr-1" />
                    )}
                    {showBackupCodes ? "Sembunyikan" : "Tampilkan"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={handleCopyCodes}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    {codesCopied ? "Tersalin" : "Salin"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={handleDownloadCodes}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                setStep("codes");
                if (isGoogleAuth) {
                  regenerateMutation.mutate({ token: disableCode });
                } else {
                  regenerateMutation.mutate({ password: disablePassword });
                }
              }}
              disabled={regenerateMutation.isPending}
            >
              <KeyRound className="w-3 h-3 mr-1" />
              Buat Kode Cadangan Baru
            </Button>

            <div className="border-t border-border/60 pt-3">
              <Label
                htmlFor={isGoogleAuth ? "disable-code" : "disable-password"}
                className="text-xs text-muted-foreground"
              >
                {isGoogleAuth
                  ? "Masukkan kode 2FA untuk menonaktifkan"
                  : "Masukkan password untuk menonaktifkan 2FA"}
              </Label>
              <div className="flex items-center gap-2 mt-1">
                {isGoogleAuth ? (
                  <Input
                    id="disable-code"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    value={disableCode}
                    onChange={(e) =>
                      setDisableCode(e.target.value.replace(/\D/g, ""))
                    }
                    className="text-sm text-center tracking-[0.3em] font-mono"
                  />
                ) : (
                  <div className="relative flex-1">
                    <Input
                      id="disable-password"
                      type={showDisablePassword ? "text" : "password"}
                      placeholder="Password saat ini"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      className="text-sm pr-8"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowDisablePassword(!showDisablePassword)
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showDisablePassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    disableMutation.mutate(
                      isGoogleAuth
                        ? { token: disableCode }
                        : { password: disablePassword },
                    )
                  }
                  disabled={
                    isDisabling ||
                    (isGoogleAuth ? disableCode.length !== 6 : !disablePassword)
                  }
                >
                  <ShieldOff className="w-4 h-4 mr-1" />
                  {isDisabling ? "Menonaktifkan..." : "Nonaktifkan"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm gap-0 border-border/60">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          Autentikasi Dua Faktor (2FA)
        </CardTitle>
        <CardDescription>
          Tambahkan lapisan keamanan ekstra dengan Google Authenticator atau
          Authy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "idle" && (
          <div className="text-center py-4">
            <Smartphone className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Lindungi akun Anda dengan kode sekali pakai dari aplikasi
              authenticator.
            </p>
            <Button
              onClick={() => setupMutation.mutate()}
              disabled={setupMutation.isPending}
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              {setupMutation.isPending ? "Menyiapkan..." : "Aktifkan 2FA"}
            </Button>
          </div>
        )}

        {step === "verify" && qrCode && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-lg border border-border/60 bg-white">
                <Image
                  src={qrCode}
                  alt="QR Code 2FA"
                  width={180}
                  height={180}
                  className="w-[180px] h-[180px]"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                Scan QR code di atas dengan aplikasi Google Authenticator atau
                Authy, lalu masukkan kode 6 digit yang muncul.
              </p>
            </div>

            {secret && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Atau masukkan kode manual:
                </p>
                <code className="text-xs bg-muted px-3 py-1.5 rounded select-all font-mono">
                  {secret}
                </code>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="verify-code" className="text-sm">
                Kode Verifikasi
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="verify-code"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, ""))
                  }
                  className="text-sm text-center tracking-[0.5em] font-mono"
                />
                <Button
                  onClick={() =>
                    verifyMutation.mutate(verificationCode)
                  }
                  disabled={isVerifying || verificationCode.length !== 6}
                >
                  {isVerifying ? "Memverifikasi..." : "Verifikasi"}
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs w-full"
              onClick={() => setStep("idle")}
            >
              Batal
            </Button>
          </div>
        )}

        {step === "codes" && backupCodes.length > 0 && (
          <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Kode Cadangan 2FA
                </p>
                <p className="text-xs text-amber-700/70 dark:text-amber-400/70">
                  Simpan kode ini di tempat aman. Setiap kode hanya bisa
                  digunakan sekali. Kode ini tidak akan ditampilkan lagi.
                </p>
              </div>
            </div>
            <div className="font-mono text-sm grid grid-cols-2 gap-2 mb-3">
              {backupCodes.map((code, i) => (
                <code
                  key={i}
                  className="p-2 rounded bg-background text-center text-xs"
                >
                  {code}
                </code>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleCopyCodes}
              >
                <Copy className="w-3 h-3 mr-1" />
                {codesCopied ? "Tersalin" : "Salin"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleDownloadCodes}
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
