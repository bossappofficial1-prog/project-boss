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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
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
        <div className="flex items-start gap-3">
            <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value}</p>
            </div>
        </div>
    );
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
    VALID: { label: "Aktif", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    REDEEMED: { label: "Digunakan", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    CANCELLED: { label: "Batal", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    EXPIRED: { label: "Expired", className: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400" },
};

function TicketStatusBadge({ status }: { status: string }) {
    const cfg = STATUS_MAP[status] ?? STATUS_MAP.VALID;
    return (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.className}`}>
            {cfg.label}
        </span>
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
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Ticket className="h-5 w-5 text-amber-600" />
                        Detail Tiket
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Product Header */}
                    <div className="flex gap-3">
                        <img
                            src={resolveUploadImageUrl(product.image)}
                            alt={product.name}
                            className="h-16 w-16 rounded-md object-cover shrink-0"
                            onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/defaults/default-product-image.png";
                            }}
                        />
                        <div className="min-w-0">
                            <h3 className="font-semibold truncate">{product.name}</h3>
                            <p className="text-lg font-bold text-primary">
                                {formatCurrency(t.sellingPrice)}
                            </p>
                            <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"} className="text-[10px]">
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
                        <h4 className="text-sm font-semibold">Informasi Event</h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <InfoRow icon={Calendar} label="Mulai" value={formatDate(t.eventDate)} />
                            {t.eventEndDate && (
                                <InfoRow icon={Calendar} label="Selesai" value={formatDate(t.eventEndDate)} />
                            )}
                            <InfoRow icon={MapPin} label="Venue" value={t.venue} />
                            {t.venueAddress && (
                                <InfoRow icon={MapPin} label="Alamat" value={t.venueAddress} />
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Quota */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold">Kuota Tiket</h4>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="rounded-md border p-2">
                                <p className="text-lg font-bold">{t.totalQuota}</p>
                                <p className="text-[11px] text-muted-foreground">Total</p>
                            </div>
                            <div className="rounded-md border p-2">
                                <p className="text-lg font-bold text-blue-600">{t.soldCount}</p>
                                <p className="text-[11px] text-muted-foreground">Terjual</p>
                            </div>
                            <div className="rounded-md border p-2">
                                <p className={`text-lg font-bold ${isSoldOut ? "text-red-500" : "text-emerald-600"}`}>
                                    {available}
                                </p>
                                <p className="text-[11px] text-muted-foreground">Tersisa</p>
                            </div>
                        </div>
                        {/* Progress bar */}
                        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${isSoldOut ? "bg-red-500" : "bg-blue-500"}`}
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
                                <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                                    {ticketCodesData.codes.map((tc: TicketCodeItem) => (
                                        <div
                                            key={tc.id}
                                            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-mono text-xs text-slate-700 dark:text-slate-300 truncate">
                                                    {tc.code}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground truncate">
                                                    {tc.orderItem.order.guestCustomer?.name ?? "Customer"} · {formatShortDate(tc.createdAt)}
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
