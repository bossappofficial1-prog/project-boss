"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
    Calendar, MapPin, Ticket, Users, ChevronLeft, ChevronRight,
    Boxes,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { resolveUploadImageUrl } from "@/lib/url";
import type { ProductItem } from "@/hooks/useProductsData";
import { useTicketCodesByProduct, type TicketCodeItem } from "@/hooks/api/use-ticket-codes";

interface TicketDetailDialogProps {
    product: ProductItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-md border border-border/40 bg-muted/20">
            <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="text-sm font-bold tracking-tight text-foreground/90 truncate">{value}</p>
            </div>
        </div>
    );
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
    VALID: { label: "Aktif", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    REDEEMED: { label: "Digunakan", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    CANCELLED: { label: "Batal", className: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
    EXPIRED: { label: "Expired", className: "bg-muted text-muted-foreground border-border" },
};

function TicketStatusBadge({ status }: { status: string }) {
    const cfg = STATUS_MAP[status] ?? STATUS_MAP.VALID;
    return (
        <Badge variant="outline" className={cn("px-2 py-0 rounded-md text-[9px] font-bold uppercase tracking-widest shadow-none bg-current/5", cfg.className)}>
            {cfg.label}
        </Badge>
    );
}

function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatShortDate(dateStr: string | null | undefined) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function TicketDetailDialog({ product, open, onOpenChange }: TicketDetailDialogProps) {
    const [page, setPage] = useState(1);
    const limit = 20;

    const { data: ticketCodesData, isLoading: codesLoading } = useTicketCodesByProduct(
        open && product?.type === "TICKET" ? product.id : null,
        page,
        limit,
    );

    if (!product || product.type !== "TICKET" || !product.ticket) return null;

    const t = product.ticket;
    const available = t.totalQuota - t.soldCount;
    const isSoldOut = available <= 0;
    const progress = t.totalQuota > 0 ? (t.soldCount / t.totalQuota) * 100 : 0;
    const totalPages = ticketCodesData ? Math.ceil(ticketCodesData.total / limit) : 1;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden p-0 gap-0 border-border/80 bg-background shadow-2xl">
                <DialogHeader className="p-6 border-b border-border/40 bg-muted/30">
                    <DialogTitle className="flex items-center gap-3 text-lg font-bold uppercase tracking-widest text-foreground">
                        <div className="p-2 rounded-md bg-background border border-border shadow-sm">
                            <Ticket className="h-5 w-5 text-primary" />
                        </div>
                        Detail Tiket Event
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Product Header */}
                    <div className="flex gap-4 p-4 rounded-md border border-border/60 bg-muted/10">
                        <div className="h-20 w-20 shrink-0 rounded-md border border-border/80 overflow-hidden shadow-sm">
                            <img
                                src={resolveUploadImageUrl(product.image)}
                                alt={product.name}
                                className="h-full w-full object-cover transition-transform hover:scale-110"
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = "/defaults/default-product-image.png";
                                }}
                            />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                            <h3 className="text-xl font-bold tracking-tight text-foreground/90 truncate">{product.name}</h3>
                            <p className="text-2xl font-bold text-primary tabular-nums tracking-tighter">
                                {formatCurrency(t.sellingPrice)}
                            </p>
                            <Badge variant="outline" className={cn(
                                "px-2 py-0 rounded-md text-[10px] font-bold uppercase tracking-widest shadow-none",
                                product.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"
                            )}>
                                {product.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                            </Badge>
                        </div>
                    </div>

                    {product.description && (
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                    )}

                    <Separator />

                    {/* Event Info */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3 w-3" /> Informasi Pelaksanaan
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <InfoRow icon={Calendar} label="Waktu Mulai" value={formatDate(t.eventDate)} />
                            {t.eventEndDate && (
                                <InfoRow icon={Calendar} label="Waktu Selesai" value={formatDate(t.eventEndDate)} />
                            )}
                            <InfoRow icon={MapPin} label="Nama Venue" value={t.venue} />
                            {t.venueAddress && (
                                <InfoRow icon={MapPin} label="Alamat Lokasi" value={t.venueAddress} />
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Quota */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Boxes className="h-3 w-3" /> Manajemen Kuota & Penjualan
                        </h4>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="rounded-md border border-border/80 p-3 bg-muted/5">
                                <p className="text-xl font-bold text-foreground/90 tabular-nums tracking-tighter">{t.totalQuota}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</p>
                            </div>
                            <div className="rounded-md border border-blue-500/20 p-3 bg-blue-500/5">
                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400 tabular-nums tracking-tighter">{t.soldCount}</p>
                                <p className="text-[10px] font-bold text-blue-600/70 uppercase tracking-widest">Terjual</p>
                            </div>
                            <div className={cn(
                                "rounded-md border p-3",
                                isSoldOut ? "border-rose-500/20 bg-rose-500/5" : "border-emerald-500/20 bg-emerald-500/5"
                            )}>
                                <p className={cn(
                                    "text-xl font-bold tabular-nums tracking-tighter",
                                    isSoldOut ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                                )}>
                                    {available}
                                </p>
                                <p className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest",
                                    isSoldOut ? "text-rose-600/70" : "text-emerald-600/70"
                                )}>Tersisa</p>
                            </div>
                        </div>
                        {/* Progress bar */}
                        <div className="h-3 w-full rounded-full bg-muted border border-border/40 overflow-hidden shadow-inner">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-1000 ease-in-out",
                                    isSoldOut ? "bg-rose-500" : "bg-primary"
                                )}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Sale Period */}
                    {(t.saleStartDate || t.saleEndDate) && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Periode Penjualan</h4>
                                <div className="flex gap-3 text-sm text-muted-foreground">
                                    <span>{formatShortDate(t.saleStartDate)}</span>
                                    <span>—</span>
                                    <span>{formatShortDate(t.saleEndDate)}</span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Terms */}
                    {t.terms && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Syarat & Ketentuan</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-line">{t.terms}</p>
                            </div>
                        </>
                    )}

                    {/* Map link */}
                    {t.mapUrl && (
                        <a
                            href={t.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                            <MapPin className="h-3.5 w-3.5" />
                            Buka di Peta
                        </a>
                    )}

                    <Separator />

                    {/* Ticket Codes */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Daftar Tiket ({ticketCodesData?.total ?? 0})
                            </h4>
                        </div>

                        {codesLoading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-12 rounded-md" />
                                ))}
                            </div>
                        ) : !ticketCodesData?.codes.length ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Belum ada tiket terjual
                            </p>
                        ) : (
                            <>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {ticketCodesData.codes.map((tc: TicketCodeItem) => (
                                        <div
                                            key={tc.id}
                                            className="flex items-center justify-between rounded-md border border-border/60 bg-muted/10 px-4 py-3 text-sm transition-all hover:bg-muted/20"
                                        >
                                            <div className="min-w-0 space-y-0.5">
                                                <p className="font-bold text-xs text-foreground/90 tracking-tight tabular-nums truncate">
                                                    {tc.code}
                                                </p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-70 truncate">
                                                    {tc.orderItem.order.guestCustomer?.name ?? "Guest Customer"} · {formatShortDate(tc.createdAt)}
                                                </p>
                                            </div>
                                            <TicketStatusBadge status={tc.status} />
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between pt-2">
                                        <p className="text-xs text-muted-foreground">
                                            Hal {page}/{totalPages}
                                        </p>
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 w-7 p-0"
                                                disabled={page <= 1}
                                                onClick={() => setPage((p) => p - 1)}
                                            >
                                                <ChevronLeft className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 w-7 p-0"
                                                disabled={page >= totalPages}
                                                onClick={() => setPage((p) => p + 1)}
                                            >
                                                <ChevronRight className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
