import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Calendar, MessageSquare, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { useIntegrations, useGoogleConnect, useDisconnectGoogle, useInitiateWhatsApp, useWhatsAppStatus, useDisconnectWhatsApp, useSendTestWhatsApp } from "@/hooks/api/use-integrations";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { useQueryClient } from "@tanstack/react-query";

interface IntegrationsCardProps {
    subscriptionPlan: string;
}

export function IntegrationsCard({ subscriptionPlan }: IntegrationsCardProps) {
    const queryClient = useQueryClient();
    const { data: integrations, isLoading, error } = useIntegrations();
    const { mutate: connectGoogle, isPending: isGoogleConnecting } = useGoogleConnect();
    const { mutate: disconnectGoogle, isPending: isGoogleDisconnecting } = useDisconnectGoogle();
    const { mutate: initiateWhatsApp, isPending: isWhatsAppInitiating } = useInitiateWhatsApp();
    const { mutate: disconnectWhatsApp, isPending: isWhatsAppDisconnecting } = useDisconnectWhatsApp();

    const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
    const [isConfirmGoogleOpen, setIsConfirmGoogleOpen] = useState(false);
    const [isConfirmWhatsAppOpen, setIsConfirmWhatsAppOpen] = useState(false);
    
    // Test send state
    const [testPhone, setTestPhone] = useState("");
    const { mutate: sendTest, isPending: isSendingTest } = useSendTestWhatsApp();

    // Enforce business plan limit: WhatsApp is only for PRO or ENTERPRISE
    const isWhatsAppAllowed = ["PRO", "ENTERPRISE"].includes(subscriptionPlan.toUpperCase());

    // WhatsApp status polling active only when the dialog is open
    const { data: waStatus } = useWhatsAppStatus(isWhatsAppOpen);

    // Watch for success state in WhatsApp status polling
    useEffect(() => {
        if (isWhatsAppOpen && waStatus?.status === "CONNECTED") {
            toast.success("WhatsApp API berhasil terhubung");
            setIsWhatsAppOpen(false);
            queryClient.invalidateQueries({ queryKey: ["integrations"] });
        }
    }, [waStatus?.status, isWhatsAppOpen, queryClient]);

    const handleGoogleConnect = () => {
        toast.loading("Mengarahkan ke Google...");
        connectGoogle(undefined, {
            onError: (err: any) => {
                toast.dismiss();
                toast.error(err?.response?.data?.message || "Gagal menghubungkan Google Calendar");
            },
        });
    };

    const handleGoogleDisconnect = () => {
        disconnectGoogle(undefined, {
            onSuccess: () => {
                toast.success("Google Calendar berhasil diputus");
                setIsConfirmGoogleOpen(false);
            },
            onError: (err: any) => {
                toast.error(err?.response?.data?.message || "Gagal memutuskan koneksi");
            },
        });
    };

    const handleWhatsAppInitiate = () => {
        setIsWhatsAppOpen(true);
        initiateWhatsApp(undefined, {
            onError: (err: any) => {
                toast.error(err?.response?.data?.message || "Gagal memulai inisialisasi WhatsApp");
                setIsWhatsAppOpen(false);
            },
        });
    };

    const handleWhatsAppDisconnect = () => {
        disconnectWhatsApp(undefined, {
            onSuccess: () => {
                toast.success("Integrasi WhatsApp berhasil diputus");
                setIsConfirmWhatsAppOpen(false);
            },
            onError: (err: any) => {
                toast.error(err?.response?.data?.message || "Gagal memutuskan WhatsApp");
            },
        });
    };

    const handleSendTest = () => {
        if (!testPhone.trim()) return;
        toast.loading("Mengirim pesan uji coba...");
        sendTest(
            {
                phoneNumber: testPhone,
                message: "Halo! Ini adalah pesan uji coba integrasi WhatsApp dari aplikasi BOSS. Koneksi gateway berhasil terhubung secara penuh!",
            },
            {
                onSuccess: () => {
                    toast.dismiss();
                    toast.success("Pesan uji coba berhasil dikirim!");
                    setTestPhone("");
                },
                onError: (err: any) => {
                    toast.dismiss();
                    toast.error(err?.response?.data?.message || "Gagal mengirim pesan uji coba");
                },
            }
        );
    };

    if (isLoading) {
        return (
            <Card className="shadow-sm border-border/60">
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-60 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="shadow-sm border-destructive/20 bg-destructive/5">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                    <p className="text-sm font-semibold">Gagal Memuat Integrasi</p>
                    <p className="text-xs text-muted-foreground mt-1">Terjadi kesalahan saat memuat data integrasi.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <RefreshCw className="h-4 w-4 text-primary" />
                    Integrasi Pihak Ketiga
                </CardTitle>
                <CardDescription>
                    Hubungkan BOSS dengan aplikasi luar untuk mengotomatiskan reservasi Anda.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* 1. GOOGLE CALENDAR INTEGRATION */}
                <div className="flex items-start justify-between p-4 border rounded-lg bg-card transition-colors hover:bg-muted/10">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/40">
                            <Calendar className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-semibold">Google Calendar</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Sinkronkan reservasi outlet ke Google Calendar secara real-time.
                            </p>
                            {integrations?.googleCalendar ? (
                                <Badge variant="outline" className="mt-1 text-green-600 border-green-500/20 bg-green-50/50 dark:bg-green-950/20 font-medium">
                                    <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                                    {integrations.googleCalendar.email || "Terhubung"}
                                </Badge>
                            ) : (
                                <span className="text-[11px] text-muted-foreground block mt-1">Belum Terhubung</span>
                            )}
                        </div>
                    </div>
                    <div className="ml-4">
                        {integrations?.googleCalendar ? (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setIsConfirmGoogleOpen(true)}
                                disabled={isGoogleDisconnecting}
                            >
                                Putuskan
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={handleGoogleConnect}
                                disabled={isGoogleConnecting}
                            >
                                Hubungkan
                            </Button>
                        )}
                    </div>
                </div>

                {/* 2. WHATSAPP INTEGRATION */}
                <div className="flex items-start justify-between p-4 border rounded-lg bg-card transition-colors hover:bg-muted/10">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-green-50 dark:bg-green-950/40">
                            <MessageSquare className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <p className="text-sm font-semibold">WhatsApp Gateway</p>
                                {!isWhatsAppAllowed && (
                                    <Badge variant="outline" className="text-[10px] font-semibold py-0 text-amber-600 border-amber-500/35 bg-amber-500/5">
                                        PRO / ENTERPRISE
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Kirim notifikasi bukti bayar dan pengingat reservasi ke nomor customer.
                            </p>
                            {integrations?.whatsapp ? (
                                <Badge variant="outline" className="mt-1 text-green-600 border-green-500/20 bg-green-50/50 dark:bg-green-950/20 font-medium">
                                    <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                                    Terhubung ({integrations.whatsapp.phoneNumber})
                                </Badge>
                            ) : (
                                <span className="text-[11px] text-muted-foreground block mt-1">Belum Terhubung</span>
                            )}
                        </div>
                    </div>
                    <div className="ml-4">
                        {!isWhatsAppAllowed ? (
                            <Button variant="outline" size="sm" disabled className="opacity-50">
                                Upgrade Plan
                            </Button>
                        ) : integrations?.whatsapp ? (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setIsConfirmWhatsAppOpen(true)}
                                disabled={isWhatsAppDisconnecting}
                            >
                                Putuskan
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={handleWhatsAppInitiate}
                                disabled={isWhatsAppInitiating}
                            >
                                Hubungkan
                            </Button>
                        )}
                    </div>
                </div>

                {/* WHATSAPP TEST SEND SECTION (ONLY IF CONNECTED) */}
                {integrations?.whatsapp && (
                    <div className="p-4 border rounded-lg bg-muted/20 mt-3 space-y-3 slideInFromTop">
                        <div>
                            <p className="text-xs font-semibold text-foreground">Kirim Pesan Uji Coba</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Masukkan nomor WhatsApp Anda untuk menguji pengiriman pesan asli dari akun Anda yang telah tertaut.
                            </p>
                        </div>
                        <div className="flex gap-2 max-w-md">
                            <input
                                type="tel"
                                placeholder="Contoh: 081234567890"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={testPhone}
                                onChange={(e) => setTestPhone(e.target.value)}
                            />
                            <Button
                                size="sm"
                                onClick={handleSendTest}
                                disabled={isSendingTest || !testPhone.trim()}
                            >
                                {isSendingTest ? "Mengirim..." : "Kirim Test WA"}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>

            {/* DIALOG SCAN WHATSAPP QR CODE */}
            <Dialog open={isWhatsAppOpen} onOpenChange={setIsWhatsAppOpen}>
                <DialogContent className="sm:max-w-md p-6">
                    <DialogHeader className="text-center">
                        <DialogTitle className="text-lg font-medium">Hubungkan WhatsApp Gateway</DialogTitle>
                        <DialogDescription className="text-sm leading-relaxed mt-1">
                            Pindai QR Code di bawah dengan HP Anda menggunakan fitur "Perangkat Tertaut" di aplikasi WhatsApp.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center py-6">
                        {waStatus?.status === "INITIALIZING" || !waStatus?.status ? (
                            <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/20 w-[240px] h-[240px] border-dashed">
                                <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
                                <p className="text-xs text-muted-foreground text-center">Menyiapkan server gateway...</p>
                            </div>
                        ) : waStatus?.status === "QR_CODE" && waStatus.qrCode ? (
                            <div className="p-3 border rounded-lg bg-white shadow-sm">
                                <QRCodeSVG value={waStatus.qrCode} size={200} />
                            </div>
                        ) : waStatus?.status === "CONNECTED" ? (
                            <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-green-500/5 w-[240px] h-[240px] border-green-500/20 text-center">
                                <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
                                <p className="text-sm font-semibold text-green-600">Terhubung!</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/20 w-[240px] h-[240px] border-dashed">
                                <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                                <p className="text-xs text-muted-foreground text-center">Gagal memuat QR Code.</p>
                            </div>
                        )}

                        <div className="mt-6 w-full space-y-3 text-xs leading-relaxed text-muted-foreground bg-muted/30 p-4 border rounded-md">
                            <p className="font-semibold text-foreground text-center mb-1">Panduan Memindai:</p>
                            <ol className="list-decimal pl-4 space-y-1.5">
                                <li>Buka aplikasi WhatsApp di HP Anda.</li>
                                <li>Ketuk ikon **Menu** (tiga titik di kanan atas) atau **Pengaturan** (di iOS).</li>
                                <li>Pilih **Perangkat Tertaut** (Linked Devices) dan ketuk **Tautkan Perangkat**.</li>
                                <li>Arahkan kamera HP Anda ke layar QR Code di atas.</li>
                            </ol>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* CONFIRM DIALOG GOOGLE */}
            <ConfirmDialog
                open={isConfirmGoogleOpen}
                onOpenChange={setIsConfirmGoogleOpen}
                title="Putuskan Hubungan Google Calendar?"
                description="BOSS tidak akan lagi menyinkronkan slot reservasi atau membuat event baru di Google Calendar Anda."
                confirmLabel="Ya, Putuskan"
                cancelLabel="Batal"
                onConfirm={handleGoogleDisconnect}
                confirmVariant="destructive"
            />

            {/* CONFIRM DIALOG WHATSAPP */}
            <ConfirmDialog
                open={isConfirmWhatsAppOpen}
                onOpenChange={setIsConfirmWhatsAppOpen}
                title="Putuskan Integrasi WhatsApp?"
                description="Pengiriman pesan notifikasi otomatis untuk customer Anda via WhatsApp akan terhenti."
                confirmLabel="Ya, Putuskan"
                cancelLabel="Batal"
                onConfirm={handleWhatsAppDisconnect}
                confirmVariant="destructive"
            />
        </Card>
    );
}
