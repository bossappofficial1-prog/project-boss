"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { gooeyToast } from "goey-toast";
import {
  Plug,
  Calendar,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  useIntegrations,
  useGoogleConnect,
  useDisconnectGoogle,
  useInitiateWhatsApp,
  useWhatsAppStatus,
  useDisconnectWhatsApp,
  useSendTestWhatsApp,
} from "@/hooks/api/use-integrations";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { useQueryClient } from "@tanstack/react-query";
import { useTwoFactorGate } from "@/hooks/use-two-factor-gate";
import { TwoFactorVerifyDialog } from "@/components/ui/two-factor-verify-dialog";

interface IntegrationsSectionProps {
  subscriptionPlan: string;
}

interface IntegrationCardProps {
  icon: React.ReactNode;
  iconBg: string;
  name: string;
  description: string;
  isConnected: boolean;
  connectionLabel?: string;
  isProOnly?: boolean;
  isAllowed?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting?: boolean;
  isDisconnecting?: boolean;
}

function IntegrationCard({
  icon,
  iconBg,
  name,
  description,
  isConnected,
  connectionLabel,
  isProOnly,
  isAllowed = true,
  onConnect,
  onDisconnect,
  isConnecting,
  isDisconnecting,
}: IntegrationCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <div className="flex items-start justify-between p-4 border border-border/60 rounded-lg bg-card transition-colors hover:bg-muted/10">
        <div className="flex items-start gap-3 min-w-0">
          <div className={cn("p-2 rounded-md shrink-0", iconBg)}>{icon}</div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold">{name}</p>
              {isProOnly && !isAllowed && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                  PRO
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
            {isConnected && connectionLabel && (
              <Badge
                variant="outline"
                className="mt-1 text-green-600 border-green-500/20 bg-green-50/50 dark:bg-green-950/20 font-medium text-[10px]"
              >
                <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                {connectionLabel}
              </Badge>
            )}
            {!isConnected && (
              <span className="text-[11px] text-muted-foreground block mt-1">
                Belum Terhubung
              </span>
            )}
          </div>
        </div>
        <div className="ml-4 shrink-0">
          {!isAllowed ? (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="opacity-50"
            >
              Upgrade
            </Button>
          ) : isConnected ? (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setShowConfirm(true)}
              disabled={isDisconnecting}
            >
              Putuskan
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onConnect}
              disabled={isConnecting}
            >
              {isConnecting ? "Menghubungkan..." : "Hubungkan"}
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title={`Putuskan ${name}?`}
        description={`Koneksi ${name} akan diputus. Anda bisa menghubungkan kembali kapan saja.`}
        confirmLabel="Ya, Putuskan"
        cancelLabel="Batal"
        onConfirm={onDisconnect}
        confirmVariant="destructive"
      />
    </>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function IntegrationsSection({ subscriptionPlan }: IntegrationsSectionProps) {
  const queryClient = useQueryClient();
  const { is2faEnabled, showVerify, require2FA, handleVerified, handleOpenChange } = useTwoFactorGate();
  const { data: integrations, isLoading, error } = useIntegrations();
  const { mutate: connectGoogle, isPending: isGoogleConnecting } =
    useGoogleConnect();
  const { mutate: disconnectGoogle, isPending: isGoogleDisconnecting } =
    useDisconnectGoogle();
  const { mutate: initiateWhatsApp, isPending: isWhatsAppInitiating } =
    useInitiateWhatsApp();
  const { mutate: disconnectWhatsApp, isPending: isWhatsAppDisconnecting } =
    useDisconnectWhatsApp();

  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const { mutate: sendTest, isPending: isSendingTest } =
    useSendTestWhatsApp();

  const isWhatsAppAllowed = ["PRO", "ENTERPRISE"].includes(
    subscriptionPlan.toUpperCase()
  );

  const { data: waStatus } = useWhatsAppStatus(isWhatsAppOpen);

  useEffect(() => {
    if (isWhatsAppOpen && waStatus?.status === "CONNECTED") {
      gooeyToast.success("WhatsApp API berhasil terhubung");
      setIsWhatsAppOpen(false);
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    }
  }, [waStatus?.status, isWhatsAppOpen, queryClient]);

  const handleGoogleConnect = () => {
    gooeyToast("Mengarahkan ke Google...", { duration: Infinity });
    connectGoogle(undefined, {
      onError: (err: any) => {
        gooeyToast.dismiss();
        gooeyToast.error(
          err?.response?.data?.message ||
            "Gagal menghubungkan Google Calendar"
        );
      },
    });
  };

  const handleGoogleDisconnect = () => {
    require2FA(() => {
      disconnectGoogle(undefined, {
        onSuccess: () => gooeyToast.success("Google Calendar berhasil diputus"),
        onError: (err: any) =>
          gooeyToast.error(
            err?.response?.data?.message || "Gagal memutuskan koneksi"
          ),
      });
    });
  };

  const handleWhatsAppInitiate = () => {
    setIsWhatsAppOpen(true);
    initiateWhatsApp(undefined, {
      onError: (err: any) => {
        gooeyToast.error(
          err?.response?.data?.message ||
            "Gagal memulai inisialisasi WhatsApp"
        );
        setIsWhatsAppOpen(false);
      },
    });
  };

  const handleWhatsAppDisconnect = () => {
    require2FA(() => {
      disconnectWhatsApp(undefined, {
        onSuccess: () => gooeyToast.success("Integrasi WhatsApp berhasil diputus"),
        onError: (err: any) =>
          gooeyToast.error(
            err?.response?.data?.message || "Gagal memutuskan WhatsApp"
          ),
      });
    });
  };

  const handleSendTest = () => {
    if (!testPhone.trim()) return;
    gooeyToast("Mengirim pesan uji coba...", { duration: Infinity });
    sendTest(
      {
        phoneNumber: testPhone,
        message:
          "Halo! Ini adalah pesan uji coba integrasi WhatsApp dari BOSS.",
      },
      {
        onSuccess: () => {
          gooeyToast.dismiss();
          gooeyToast.success("Pesan uji coba berhasil dikirim!");
          setTestPhone("");
        },
        onError: (err: any) => {
          gooeyToast.dismiss();
          gooeyToast.error(
            err?.response?.data?.message || "Gagal mengirim pesan uji coba"
          );
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Plug className="w-5 h-5 text-primary" />
            Integrasi
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Hubungkan dengan aplikasi pihak ketiga.
          </p>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Plug className="w-5 h-5 text-primary" />
            Integrasi
          </h2>
        </div>
        <Card className="shadow-sm border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm font-semibold">Gagal Memuat Integrasi</p>
            <p className="text-xs text-muted-foreground mt-1">
              Terjadi kesalahan saat memuat data integrasi.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TwoFactorVerifyDialog
        open={showVerify}
        onOpenChange={handleOpenChange}
        onVerified={handleVerified}
        title="Verifikasi Putuskan Integrasi"
        description="Masukkan kode 2FA untuk memutuskan koneksi integrasi ini."
      />
      <div>
        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <Plug className="w-5 h-5 text-primary" />
          Integrasi
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Hubungkan BOSS dengan aplikasi luar untuk mengotomatiskan alur kerja.
        </p>
      </div>

      <div className="space-y-3">
        <IntegrationCard
          icon={<Calendar className="h-5 w-5 text-blue-500" />}
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          name="Google Calendar"
          description="Sinkronkan reservasi outlet ke Google Calendar secara real-time."
          isConnected={Boolean(integrations?.googleCalendar)}
          connectionLabel={integrations?.googleCalendar?.email || "Terhubung"}
          onConnect={handleGoogleConnect}
          onDisconnect={handleGoogleDisconnect}
          isConnecting={isGoogleConnecting}
          isDisconnecting={isGoogleDisconnecting}
        />

        <IntegrationCard
          icon={<MessageSquare className="h-5 w-5 text-green-500" />}
          iconBg="bg-green-50 dark:bg-green-950/40"
          name="WhatsApp Gateway"
          description="Kirim notifikasi bukti bayar dan pengingat reservasi ke customer."
          isConnected={Boolean(integrations?.whatsapp)}
          connectionLabel={
            integrations?.whatsapp
              ? `Terhubung (${integrations.whatsapp.phoneNumber})`
              : undefined
          }
          isProOnly
          isAllowed={isWhatsAppAllowed}
          onConnect={handleWhatsAppInitiate}
          onDisconnect={handleWhatsAppDisconnect}
          isConnecting={isWhatsAppInitiating}
          isDisconnecting={isWhatsAppDisconnecting}
        />
      </div>

      {/* WhatsApp test send */}
      {integrations?.whatsapp && (
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Kirim Pesan Uji Coba</CardTitle>
            <CardDescription className="text-xs">
              Tes pengiriman pesan WhatsApp dari akun yang terhubung.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="081234567890"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
              <Button
                size="sm"
                onClick={handleSendTest}
                disabled={isSendingTest || !testPhone.trim()}
              >
                {isSendingTest ? "Mengirim..." : "Kirim"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* WhatsApp QR Dialog */}
      <Dialog open={isWhatsAppOpen} onOpenChange={setIsWhatsAppOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-medium">
              Hubungkan WhatsApp
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed mt-1">
              Pindai QR Code dengan HP Anda menggunakan "Perangkat Tertaut" di
              WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6">
            {waStatus?.status === "INITIALIZING" || !waStatus?.status ? (
              <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/20 w-[240px] h-[240px] border-dashed">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
                <p className="text-xs text-muted-foreground text-center">
                  Menyiapkan server gateway...
                </p>
              </div>
            ) : waStatus?.status === "QR_CODE" && waStatus.qrCode ? (
              <div className="p-3 border rounded-lg bg-white shadow-sm">
                <QRCodeSVG value={waStatus.qrCode} size={200} />
              </div>
            ) : waStatus?.status === "CONNECTED" ? (
              <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-green-500/5 w-[240px] h-[240px] border-green-500/20 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
                <p className="text-sm font-semibold text-green-600">
                  Terhubung!
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/20 w-[240px] h-[240px] border-dashed">
                <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                <p className="text-xs text-muted-foreground text-center">
                  Gagal memuat QR Code.
                </p>
              </div>
            )}

            <div className="mt-6 w-full space-y-3 text-xs leading-relaxed text-muted-foreground bg-muted/30 p-4 border rounded-md">
              <p className="font-semibold text-foreground text-center mb-1">
                Panduan:
              </p>
              <ol className="list-decimal pl-4 space-y-1.5">
                <li>Buka WhatsApp di HP Anda.</li>
                <li>
                  Menu (titik tiga) → Perangkat Tertaut → Tautkan Perangkat.
                </li>
                <li>Arahkan kamera ke QR Code di atas.</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
