"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useVerifyTicket, useRedeemTicket, TicketCodeInfo } from "@/hooks/use-ticket";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    Ticket,
    MapPin,
    Calendar,
    User,
    Phone,
    Loader2,
    ScanLine,
    RotateCcw,
    ChevronRight,
    Camera,
} from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { cn } from "@/lib/utils";
import { useCashierContext } from "@/components/layouts";

const STATUS_CONFIG: Record<
    string,
    { label: string; borderColor: string; color: string; icon: typeof Ticket }
> = {
    VALID: {
        label: "Aktif",
        borderColor: "border-l-emerald-500",
        color: "bg-emerald-500/10 text-emerald-500",
        icon: Ticket,
    },
    REDEEMED: {
        label: "Sudah Digunakan",
        borderColor: "border-l-primary",
        color: "bg-primary/10 text-primary",
        icon: CheckCircle2,
    },
    CANCELLED: {
        label: "Dibatalkan",
        borderColor: "border-l-destructive",
        color: "bg-destructive/10 text-destructive",
        icon: XCircle,
    },
    EXPIRED: {
        label: "Kadaluarsa",
        borderColor: "border-l-muted-foreground",
        color: "bg-muted text-muted-foreground",
        icon: Clock,
    },
};

function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <Icon className="w-4 h-4 text-muted-foreground/60 mt-0.5 shrink-0" />
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium text-foreground">{value}</p>
            </div>
        </div>
    );
}

export default function TicketScanContent() {
    const { outletData } = useCashierContext();
    const outletId = outletData?.id;

    const [searchCode, setSearchCode] = useState("");
    const [activeCode, setActiveCode] = useState("");
    const [recentScans, setRecentScans] = useState<TicketCodeInfo[]>([]);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [cameraOpen, setCameraOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);

    const { data: ticketInfo, isLoading, error, isFetching } = useVerifyTicket(activeCode);
    const redeemMutation = useRedeemTicket();

    useEffect(() => {
        if (ticketInfo) {
            setRecentScans((prev) => {
                const filtered = prev.filter((s) => s.code !== ticketInfo.code);
                return [ticketInfo, ...filtered].slice(0, 5);
            });
        }
    }, [ticketInfo]);

    useEffect(() => {
        if (!cameraOpen || !videoRef.current) return;

        let cancelled = false;
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        reader
            .decodeFromVideoDevice(
                undefined,
                videoRef.current,
                (result, _err, controls) => {
                    if (cancelled) {
                        controls?.stop();
                        return;
                    }

                    if (result?.getText()) {
                        const scannedCode = result.getText();
                        setSearchCode(scannedCode);
                        setActiveCode(scannedCode);
                        controls?.stop();
                        setCameraOpen(false);
                    }
                },
            )
            .catch((e) => {
                console.error(e);
                setCameraOpen(false);
                toast.error("Kamera tidak dapat diakses");
            });

        return () => {
            cancelled = true;
            if (readerRef.current) {
                readerRef.current = null;
            }
        };
    }, [cameraOpen]);

    const handleSearch = useCallback(() => {
        const code = searchCode.trim().toUpperCase();
        if (!code) return;
        setActiveCode(code);
    }, [searchCode]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter") handleSearch();
        },
        [handleSearch]
    );

    const handleRedeem = useCallback(async () => {
        if (!activeCode) return;
        try {
            const result = await redeemMutation.mutateAsync({ code: activeCode, outletId });
            toast.success(`Tiket ${result.code} berhasil di-redeem!`);
            setConfirmOpen(false);
            setActiveCode("");
            setSearchCode("");
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Gagal redeem tiket";
            toast.error(msg);
        }
    }, [activeCode, redeemMutation, outletId]);

    const handleClear = useCallback(() => {
        setSearchCode("");
        setActiveCode("");
        inputRef.current?.focus();
    }, []);

    const config = useMemo(() => {
        if (!ticketInfo) return null;
        return STATUS_CONFIG[ticketInfo.status] || null;
    }, [ticketInfo]);

    return (
        <div className="mx-auto max-w-[1600px] p-4 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-foreground">
                        Scanner Tiket
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Verifikasi dan redeem tiket pelanggan secara instan
                    </p>
                </div>
                {activeCode && (
                    <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground hover:text-foreground">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Scan Baru
                    </Button>
                )}
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <ScanLine className="w-6 h-6 text-primary shrink-0" />
                <Input
                    ref={inputRef}
                    value={searchCode}
                    onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setSearchCode(val);
                        // Auto-search if it looks like a full ticket code (e.g., starts with TIX- and has enough chars)
                        if (val.startsWith("TIX-") && val.length >= 12) {
                            setActiveCode(val);
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Masukkan atau scan kode tiket..."
                    className="border-0 shadow-none focus-visible:ring-0 font-mono tracking-widest text-base p-0 h-auto placeholder:text-muted-foreground/50 placeholder:font-sans placeholder:tracking-normal"
                    autoFocus
                />
                <Button
                    type="button"
                    variant={cameraOpen ? "secondary" : "outline"}
                    onClick={() => {
                        setCameraOpen(!cameraOpen);
                    }}
                    title="Scan Barcode/QR Kamera"
                    className="shrink-0 rounded-lg px-3"
                >
                    <Camera className="w-5 h-5" />
                </Button>
                <Button
                    size="sm"
                    onClick={handleSearch}
                    disabled={!searchCode.trim() || isLoading}
                    className="shrink-0 rounded-lg px-4"
                >
                    {isFetching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <Search className="w-4 h-4 mr-2" />
                            Verifikasi
                        </>
                    )}
                </Button>
            </div>

            {cameraOpen && (
                <div className="relative aspect-video w-full max-w-lg mx-auto overflow-hidden rounded-xl border-2 border-primary bg-black shadow-lg">
                    <video ref={videoRef} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 border-4 border-primary/40 m-8 rounded-2xl pointer-events-none animate-pulse" />
                    <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-3 right-3 h-8 w-8 p-0 rounded-full opacity-80 hover:opacity-100 shadow-md"
                        onClick={() => {
                            setCameraOpen(false);
                        }}
                    >
                        <XCircle className="h-5 w-5" />
                    </Button>
                    <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none">
                        <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                            Arahkan kamera ke QR Code atau Barcode
                        </span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Ticket Result Card */}
                <div className="space-y-4">
                    {/* Loading */}
                    {isLoading && activeCode && (
                        <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
                            <div className="relative w-12 h-12 mx-auto mb-4">
                                <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
                                <Ticket className="w-6 h-6 text-primary absolute inset-0 m-auto animate-pulse" />
                            </div>
                            <p className="text-sm font-medium text-foreground">Memverifikasi Tiket</p>
                            <p className="text-xs text-muted-foreground mt-1">Mohon tunggu sebentar...</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && activeCode && !isLoading && (
                        <div className="rounded-xl border-l-4 border-l-destructive border border-border bg-card p-5 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="rounded-full bg-destructive/10 p-2 shrink-0">
                                    <XCircle className="w-6 h-6 text-destructive" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-foreground">
                                        Tiket Tidak Valid
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Kode <code className="bg-muted px-1 rounded text-foreground font-mono">{activeCode}</code> tidak ditemukan dalam sistem kami. Pastikan kode sudah benar atau scan ulang.
                                    </p>
                                    <Button 
                                        variant="link" 
                                        size="sm" 
                                        className="p-0 h-auto text-xs text-primary font-semibold"
                                        onClick={handleClear}
                                    >
                                        Coba Kode Lain
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Ticket Card */}
                    {ticketInfo && config && (
                        <div
                            className={cn(
                                "rounded-xl border-l-4 bg-card border border-border shadow-sm overflow-hidden",
                                config.borderColor
                            )}
                        >
                            <div className="p-5 space-y-4">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                                Informasi Tiket
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground leading-tight mb-0.5">
                                            {ticketInfo.productName}
                                        </h3>
                                        <code className="text-xs font-mono text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                                            {ticketInfo.code}
                                        </code>
                                    </div>
                                    <Badge variant="outline" className={cn("text-[10px] font-bold border-0 h-6 px-2 shrink-0 rounded-md", config.color)}>
                                        {config.label}
                                    </Badge>
                                </div>

                                <Separator className="opacity-50" />

                                {/* Meta Info Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Acara</p>
                                        <div className="space-y-2">
                                            {ticketInfo.eventDate && (
                                                <span className="flex items-center gap-2 text-xs text-foreground">
                                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                    {formatDate(ticketInfo.eventDate)}
                                                </span>
                                            )}
                                            {ticketInfo.venue && (
                                                <span className="flex items-center gap-2 text-xs text-foreground">
                                                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                                    {ticketInfo.venue}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pemesan</p>
                                        <div className="space-y-2">
                                            <span className="flex items-center gap-2 text-xs text-foreground">
                                                <User className="w-3.5 h-3.5 text-muted-foreground" />
                                                {ticketInfo.customerName || "-"}
                                            </span>
                                            <span className="flex items-center gap-2 text-xs text-foreground">
                                                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                                {ticketInfo.customerPhone || "-"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Specific Info */}
                                {ticketInfo.status === "REDEEMED" && ticketInfo.redeemedAt && (
                                    <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 space-y-1">
                                        <div className="flex items-center gap-2 text-primary">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <p className="text-xs font-bold">Informasi Penukaran</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Tiket ini telah digunakan pada <span className="text-foreground font-medium">{formatDate(ticketInfo.redeemedAt)}</span>
                                            {ticketInfo.redeemedBy && (
                                                <> oleh <span className="text-foreground font-medium">{ticketInfo.redeemedBy.name}</span></>
                                            )}
                                        </p>
                                    </div>
                                )}

                                {ticketInfo.status === "CANCELLED" && (
                                    <div className="rounded-lg bg-destructive/5 border border-destructive/10 p-4 space-y-1">
                                        <div className="flex items-center gap-2 text-destructive">
                                            <XCircle className="w-4 h-4" />
                                            <p className="text-xs font-bold">Tiket Dibatalkan</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Maaf, tiket ini telah dibatalkan dan tidak dapat digunakan lagi untuk penukaran.
                                        </p>
                                    </div>
                                )}

                                {ticketInfo.status === "EXPIRED" && (
                                    <div className="rounded-lg bg-muted border border-border p-4 space-y-1">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock className="w-4 h-4" />
                                            <p className="text-xs font-bold">Tiket Kadaluarsa</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Masa berlaku tiket ini telah habis. Silakan hubungi customer service jika ada kendala.
                                        </p>
                                    </div>
                                )}

                                {/* Redeem Action */}
                                {ticketInfo.status === "VALID" && (
                                    <div className="pt-2">
                                        <Button
                                            className="w-full h-10 text-sm font-bold shadow-lg shadow-primary/20"
                                            onClick={() => setConfirmOpen(true)}
                                            disabled={redeemMutation.isPending}
                                        >
                                            Konfirmasi Penukaran
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!activeCode && (
                        <div className="rounded-xl border-2 border-dashed border-border bg-card p-12 text-center transition-colors hover:border-primary/50">
                            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Ticket className="w-10 h-10 text-primary opacity-40" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2">
                                Siap Melakukan Scan
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
                                Arahkan scanner ke QR Code tiket pelanggan atau ketik kode tiket secara manual di atas.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4 text-xs font-medium text-muted-foreground/60">
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Verifikasi Instan
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Redeem Cepat
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: History/Detail Panel */}
                <div className="space-y-4">
                    {/* Recent Scans (New Logic) */}
                    {recentScans.length > 0 && (
                        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                                <h4 className="text-sm font-bold text-foreground">
                                    Riwayat Scan
                                </h4>
                                <Badge variant="secondary" className="text-[10px] h-5">
                                    {recentScans.length} Baru
                                </Badge>
                            </div>
                            <div className="divide-y divide-border">
                                {recentScans.map((scan) => (
                                    <div 
                                        key={scan.code} 
                                        className="p-3 hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                                        onClick={() => {
                                            setSearchCode(scan.code);
                                            setActiveCode(scan.code);
                                        }}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                                {scan.productName}
                                            </p>
                                            <p className="text-[10px] font-mono text-muted-foreground">
                                                {scan.code}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-medium text-foreground">
                                                {scan.customerName || "No Name"}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground uppercase text-xs">
                                                {STATUS_CONFIG[scan.status]?.label}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ticket Detail Panel (shown when active) */}
                    {ticketInfo && config && (
                        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden sticky top-4">
                            <div className="px-5 py-4 border-b border-border bg-muted/30">
                                <h4 className="text-sm font-bold text-foreground">
                                    Detail Lengkap
                                </h4>
                            </div>
                            <div className="p-5 space-y-6">
                                {/* Pelanggan */}
                                <section className="space-y-4">
                                    <h5 className="text-[10px] font-bold text-muted-foreground">Data Pelanggan</h5>
                                    <div className="space-y-3">
                                        <InfoRow icon={User} label="Nama Lengkap" value={ticketInfo.customerName || "-"} />
                                        <InfoRow icon={Phone} label="No. Telepon" value={ticketInfo.customerPhone || "-"} />
                                    </div>
                                </section>

                                <Separator className="opacity-50" />

                                {/* Event */}
                                <section className="space-y-4">
                                    <h5 className="text-[10px] font-bold text-muted-foreground">Informasi Penyelenggara</h5>
                                    <div className="space-y-3">
                                        <InfoRow icon={Ticket} label="Produk/Layanan" value={ticketInfo.productName} />
                                        {ticketInfo.eventDate && (
                                            <InfoRow icon={Calendar} label="Waktu Pelaksanaan" value={formatDate(ticketInfo.eventDate)} />
                                        )}
                                        {ticketInfo.venue && (
                                            <InfoRow icon={MapPin} label="Lokasi Penukaran" value={ticketInfo.venue} />
                                        )}
                                        {ticketInfo.venueAddress && (
                                            <InfoRow icon={MapPin} label="Alamat Lengkap" value={ticketInfo.venueAddress} />
                                        )}
                                    </div>
                                </section>

                                {/* Redeemed detail */}
                                {ticketInfo.status === "REDEEMED" && ticketInfo.redeemedAt && (
                                    <>
                                        <Separator />
                                        <section className="space-y-4">
                                            <h5 className="text-[10px] font-bold text-muted-foreground">Info Redeem</h5>
                                            <div className="space-y-3">
                                                <InfoRow icon={Clock} label="Waktu Redeem" value={formatDate(ticketInfo.redeemedAt)} />
                                                {ticketInfo.redeemedBy && (
                                                    <InfoRow icon={User} label="Oleh" value={ticketInfo.redeemedBy.name} />
                                                )}
                                            </div>
                                        </section>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Redeem Dialog */}
            {ticketInfo && (
                <ConfirmDialog
                    open={confirmOpen}
                    onOpenChange={setConfirmOpen}
                    title="Redeem Tiket"
                    description={`Konfirmasi redeem tiket "${ticketInfo.productName}" untuk ${ticketInfo.customerName || "pelanggan"}?\n\nKode: ${ticketInfo.code}`}
                    confirmLabel="Redeem"
                    confirmVariant="default"
                    confirmLoading={redeemMutation.isPending}
                    onConfirm={handleRedeem}
                />
            )}
        </div>
    );
}
