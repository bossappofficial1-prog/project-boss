"use client";

import { useState, useRef, useCallback } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
    string,
    { label: string; borderColor: string; badgeColor: string; icon: typeof Ticket }
> = {
    VALID: {
        label: "Aktif",
        borderColor: "border-l-emerald-500",
        badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        icon: Ticket,
    },
    REDEEMED: {
        label: "Sudah Digunakan",
        borderColor: "border-l-blue-500",
        badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        icon: CheckCircle2,
    },
    CANCELLED: {
        label: "Dibatalkan",
        borderColor: "border-l-red-500",
        badgeColor: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        icon: XCircle,
    },
    EXPIRED: {
        label: "Kadaluarsa",
        borderColor: "border-l-gray-500",
        badgeColor: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
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
            <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value}</p>
            </div>
        </div>
    );
}

export default function TicketScanContent() {
    const [searchCode, setSearchCode] = useState("");
    const [activeCode, setActiveCode] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: ticketInfo, isLoading, error, isFetching } = useVerifyTicket(activeCode);
    const redeemMutation = useRedeemTicket();

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
            const result = await redeemMutation.mutateAsync(activeCode);
            toast.success(`Tiket ${result.code} berhasil di-redeem!`);
            setConfirmOpen(false);
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Gagal redeem tiket";
            toast.error(msg);
        }
    }, [activeCode, redeemMutation]);

    const handleClear = useCallback(() => {
        setSearchCode("");
        setActiveCode("");
        inputRef.current?.focus();
    }, []);

    const config = ticketInfo ? STATUS_CONFIG[ticketInfo.status] : null;

    return (
        <div className="mx-auto max-w-[1600px] p-4 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        Scan Tiket
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Verifikasi dan redeem tiket pelanggan
                    </p>
                </div>
                {activeCode && (
                    <Button variant="outline" size="sm" onClick={handleClear}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                    </Button>
                )}
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 shadow-sm">
                <ScanLine className="w-5 h-5 text-slate-400 shrink-0" />
                <Input
                    ref={inputRef}
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                    placeholder="Masukkan kode tiket (contoh: TIX-ABCD1234)"
                    className="border-0 shadow-none focus-visible:ring-0 font-mono tracking-wider text-sm p-0 h-auto"
                    autoFocus
                />
                <Button
                    size="sm"
                    onClick={handleSearch}
                    disabled={!searchCode.trim() || isLoading}
                    className="shrink-0"
                >
                    {isFetching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <Search className="w-4 h-4 mr-1" />
                            Cari
                        </>
                    )}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Ticket Result Card */}
                <div className="space-y-4">
                    {/* Loading */}
                    {isLoading && activeCode && (
                        <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-2" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">Memverifikasi tiket...</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && activeCode && !isLoading && (
                        <div className="rounded-md border-l-4 border-l-red-500 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                        Tiket tidak ditemukan
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Kode &quot;{activeCode}&quot; tidak valid atau tidak terdaftar
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Ticket Card */}
                    {ticketInfo && config && (
                        <div
                            className={cn(
                                "rounded-md border-l-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm",
                                config.borderColor
                            )}
                        >
                            <div className="p-4 space-y-3">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                            {ticketInfo.productName}
                                        </h3>
                                        <code className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                            {ticketInfo.code}
                                        </code>
                                    </div>
                                    <Badge variant="outline" className={cn("text-[10px] border-0 shrink-0", config.badgeColor)}>
                                        {config.label}
                                    </Badge>
                                </div>

                                {/* Event Info */}
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                    {ticketInfo.eventDate && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(ticketInfo.eventDate)}
                                        </span>
                                    )}
                                    {ticketInfo.venue && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {ticketInfo.venue}
                                        </span>
                                    )}
                                </div>

                                {/* Customer */}
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {ticketInfo.customerName || "-"}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        {ticketInfo.customerPhone || "-"}
                                    </span>
                                </div>

                                {/* Redeemed info */}
                                {ticketInfo.status === "REDEEMED" && ticketInfo.redeemedAt && (
                                    <div className="rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-2.5 text-xs text-blue-700 dark:text-blue-400 space-y-0.5">
                                        <p className="font-medium">Sudah di-redeem: {formatDate(ticketInfo.redeemedAt)}</p>
                                        {ticketInfo.redeemedBy && (
                                            <p>Oleh: {ticketInfo.redeemedBy.name}</p>
                                        )}
                                    </div>
                                )}

                                {ticketInfo.status === "CANCELLED" && (
                                    <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-2.5 text-xs text-red-700 dark:text-red-400">
                                        <p className="font-medium">Tiket ini sudah dibatalkan</p>
                                    </div>
                                )}

                                {ticketInfo.status === "EXPIRED" && (
                                    <div className="rounded-md bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2.5 text-xs text-gray-600 dark:text-gray-400">
                                        <p className="font-medium">Tiket ini sudah kadaluarsa</p>
                                    </div>
                                )}

                                {/* Redeem Action */}
                                {ticketInfo.status === "VALID" && (
                                    <div className="pt-1">
                                        <Button
                                            className="w-full h-8 text-xs"
                                            size="sm"
                                            onClick={() => setConfirmOpen(true)}
                                            disabled={redeemMutation.isPending}
                                        >
                                            Redeem Tiket
                                            <ChevronRight className="w-3 h-3 ml-1" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!activeCode && (
                        <div className="rounded-md border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center">
                            <Ticket className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Scan atau masukkan kode tiket
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                Hasil verifikasi akan ditampilkan di sini
                            </p>
                        </div>
                    )}
                </div>

                {/* Right: Detail Panel */}
                {ticketInfo && config && (
                    <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Detail Tiket
                            </h4>
                        </div>
                        <div className="p-4 space-y-4">
                            {/* Pelanggan */}
                            <section className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pelanggan</h4>
                                <div className="space-y-2">
                                    <InfoRow icon={User} label="Nama" value={ticketInfo.customerName || "-"} />
                                    <InfoRow icon={Phone} label="Telepon" value={ticketInfo.customerPhone || "-"} />
                                </div>
                            </section>

                            <Separator />

                            {/* Event */}
                            <section className="space-y-3">
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Informasi Event</h4>
                                <div className="space-y-2">
                                    <InfoRow icon={Ticket} label="Produk" value={ticketInfo.productName} />
                                    {ticketInfo.eventDate && (
                                        <InfoRow icon={Calendar} label="Tanggal" value={formatDate(ticketInfo.eventDate)} />
                                    )}
                                    {ticketInfo.eventEndDate && (
                                        <InfoRow icon={Calendar} label="Berakhir" value={formatDate(ticketInfo.eventEndDate)} />
                                    )}
                                    {ticketInfo.venue && (
                                        <InfoRow icon={MapPin} label="Lokasi" value={ticketInfo.venue} />
                                    )}
                                    {ticketInfo.venueAddress && (
                                        <InfoRow icon={MapPin} label="Alamat" value={ticketInfo.venueAddress} />
                                    )}
                                </div>
                            </section>

                            {/* Redeemed detail */}
                            {ticketInfo.status === "REDEEMED" && ticketInfo.redeemedAt && (
                                <>
                                    <Separator />
                                    <section className="space-y-3">
                                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Info Redeem</h4>
                                        <div className="space-y-2">
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
