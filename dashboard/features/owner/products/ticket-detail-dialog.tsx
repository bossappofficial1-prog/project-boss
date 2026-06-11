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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Calendar, MapPin, Ticket, Users, ChevronLeft, ChevronRight, Boxes, ExternalLink, FileText
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { resolveUploadImageUrl } from "@/lib/url";
import type { ProductItem } from "@/hooks/use-products-data";
import { useTicketCodesByProduct, type TicketCodeItem } from "@/hooks/api/use-ticket-codes";
import { toast } from "sonner";

interface TicketDetailDialogProps {
    product: ProductItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
    VALID: { label: "Aktif", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    REDEEMED: { label: "Hadir", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    CANCELLED: { label: "Batal", className: "bg-destructive/10 text-destructive border-destructive/20" },
    EXPIRED: { label: "Expired", className: "bg-muted text-muted-foreground border-border" },
};

function TicketStatusBadge({ status }: { status: string }) {
    const cfg = STATUS_MAP[status] ?? STATUS_MAP.VALID;
    return (
        <Badge variant="outline" className={cn("px-1.5 py-0 rounded-sm text-[9px] font-bold uppercase tracking-widest", cfg.className)}>
            {cfg.label}
        </Badge>
    );
}

function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
}

function formatShortDate(dateStr: string | null | undefined) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric", month: "short", year: "numeric",
    });
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="flex items-start gap-2.5 py-2.5 px-3 rounded-md border border-border/50 bg-muted/20">
            <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="text-xs font-semibold text-foreground truncate">{value}</p>
            </div>
        </div>
    );
}

function StatBox({ value, label, className }: { value: number | string; label: string; className?: string }) {
    return (
        <div className={cn("rounded-md border p-2.5 text-center", className)}>
            <p className="text-lg font-bold tabular-nums tracking-tight">{value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{label}</p>
        </div>
    );
}

export default function TicketDetailDialog({ product, open, onOpenChange }: TicketDetailDialogProps) {
    const [page, setPage] = useState(1);
    const limit = 20;

    const { data: ticketCodesData, isLoading: codesLoading } = useTicketCodesByProduct(
        open && product?.type === "TICKET" ? product.id : null,
        page,
        limit,
    );

    const handleExportCsv = () => {
        if (!product) return;
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1234/api/v1';
        const exportUrl = `${apiBaseUrl}/tickets/product/${product.id}/export`;
        
        // Trigger download
        window.open(exportUrl, "_blank");
        toast.success("Mengekspor data tiket ke file CSV...");
    };

    if (!product || product.type !== "TICKET" || !product.ticket) return null;

    const t = product.ticket;
    const available = t.totalQuota - t.soldCount;
    const isSoldOut = available <= 0;
    const progress = t.totalQuota > 0 ? (t.soldCount / t.totalQuota) * 100 : 0;
    const totalPages = ticketCodesData ? Math.ceil(ticketCodesData.total / limit) : 1;
    const checkinProgress = ticketCodesData?.total || 0 > 0
        ? (ticketCodesData?.totalRedeemed || 0 / ticketCodesData?.total! || 0) * 100
        : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0 border-border/80 bg-background">
                <DialogHeader className="px-5 py-4 border-b border-border/50 shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
                        <Ticket className="h-4 w-4 text-primary shrink-0" />
                        Detail Tiket Event
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    {/* Product Hero */}
                    <div className="px-5 py-4 flex gap-3 border-b border-border/50">
                        <div className="h-16 w-16 shrink-0 rounded-md border border-border/80 overflow-hidden">
                            <img
                                src={resolveUploadImageUrl(product.image)}
                                alt={product.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = "/defaults/default-product-image.png";
                                }}
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="text-sm font-semibold tracking-tight text-foreground truncate">{product.name}</h3>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "shrink-0 px-1.5 py-0 rounded-sm text-[9px] font-bold uppercase tracking-widest",
                                        product.status === "ACTIVE"
                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                            : "bg-muted text-muted-foreground border-border"
                                    )}
                                >
                                    {product.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                                </Badge>
                            </div>
                            <p className="text-lg font-bold text-primary tabular-nums tracking-tight mt-0.5">
                                {formatCurrency(t.sellingPrice)}
                            </p>
                            {product.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{product.description}</p>
                            )}
                        </div>
                    </div>

                    <Tabs defaultValue="info" className="px-5 py-4">
                        <TabsList className="w-full h-8 mb-4">
                            <TabsTrigger value="info" className="flex-1 text-xs">Info Event</TabsTrigger>
                            <TabsTrigger value="quota" className="flex-1 text-xs">Kuota</TabsTrigger>
                            <TabsTrigger value="codes" className="flex-1 text-xs">
                                Tiket ({ticketCodesData?.total ?? 0})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="space-y-3 mt-0">
                            <div className="grid gap-2 sm:grid-cols-2">
                                <InfoRow icon={Calendar} label="Waktu Mulai" value={formatDate(t.eventDate)} />
                                {t.eventEndDate && (
                                    <InfoRow icon={Calendar} label="Waktu Selesai" value={formatDate(t.eventEndDate)} />
                                )}
                                <InfoRow icon={MapPin} label="Venue" value={t.venue} />
                                {t.venueAddress && (
                                    <InfoRow icon={MapPin} label="Alamat" value={t.venueAddress} />
                                )}
                            </div>

                            {(t.saleStartDate || t.saleEndDate) && (
                                <div className="px-3 py-2.5 rounded-md border border-border/50 bg-muted/20">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Periode Penjualan</p>
                                    <p className="text-xs font-semibold text-foreground">
                                        {formatShortDate(t.saleStartDate)} — {formatShortDate(t.saleEndDate)}
                                    </p>
                                </div>
                            )}

                            {t.terms && (
                                <div className="px-3 py-2.5 rounded-md border border-border/50 bg-muted/20">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Syarat & Ketentuan</p>
                                    <p className="text-xs text-muted-foreground whitespace-pre-line">{t.terms}</p>
                                </div>
                            )}

                            {t.mapUrl && (
                                <a
                                    href={t.mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    Buka di Peta
                                </a>
                            )}
                        </TabsContent>

                        <TabsContent value="quota" className="space-y-4 mt-0">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2">
                                    <Boxes className="h-3 w-3" /> Kuota & Penjualan
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    <StatBox value={t.totalQuota} label="Total" className="border-border/50 bg-muted/10" />
                                    <StatBox value={t.soldCount} label="Terjual" className="border-blue-500/20 bg-blue-500/5 text-blue-600" />
                                    <StatBox
                                        value={available}
                                        label="Tersisa"
                                        className={isSoldOut
                                            ? "border-destructive/20 bg-destructive/5 text-destructive"
                                            : "border-emerald-500/20 bg-emerald-500/5 text-emerald-600"
                                        }
                                    />
                                </div>
                                <div className="mt-3 h-2 w-full rounded-full bg-muted border border-border/40 overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full", isSoldOut ? "bg-destructive" : "bg-primary")}
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground text-right mt-1">
                                    {Math.round(progress)}% terjual
                                </p>
                            </div>

                            <Separator />

                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2">
                                    <Users className="h-3 w-3" /> Check-In Real-time
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <StatBox
                                        value={ticketCodesData?.totalRedeemed ?? 0}
                                        label="Sudah Hadir"
                                        className="border-blue-500/20 bg-blue-500/5 text-blue-600"
                                    />
                                    <StatBox
                                        value={ticketCodesData?.totalValid ?? 0}
                                        label="Belum Hadir"
                                        className="border-emerald-500/20 bg-emerald-500/5 text-emerald-600"
                                    />
                                </div>
                                {ticketCodesData && ticketCodesData.total > 0 && (
                                    <>
                                        <div className="mt-3 h-2 w-full rounded-full bg-emerald-500/20 overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500"
                                                style={{ width: `${checkinProgress}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground text-right mt-1">
                                            {Math.round(checkinProgress)}% hadir
                                        </p>
                                    </>
                                )}
                            </div>
                        </TabsContent>

                         <TabsContent value="codes" className="mt-0">
                            {codesLoading ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <Skeleton key={i} className="h-10 rounded-md" />
                                    ))}
                                </div>
                            ) : !ticketCodesData?.codes.length ? (
                                <div className="py-8 text-center">
                                    <Ticket className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground">Belum ada tiket terjual</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Daftar Tiket Terjual</span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleExportCsv}
                                            className="h-7 gap-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-border/80 shadow-xs"
                                        >
                                            <FileText className="h-3 w-3 text-primary" />
                                            Ekspor CSV
                                        </Button>
                                    </div>
                                    <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                                        {ticketCodesData.codes.map((tc: TicketCodeItem) => (
                                            <div
                                                key={tc.id}
                                                className="flex items-center justify-between rounded-md border border-border/50 bg-muted/10 px-3 py-2 hover:bg-muted/20"
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-mono text-xs font-semibold text-foreground truncate">
                                                        {tc.code}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground truncate">
                                                        {tc.orderItem.order.guestCustomer?.name ?? "Guest"} · {formatShortDate(tc.createdAt)}
                                                    </p>
                                                </div>
                                                <TicketStatusBadge status={tc.status} />
                                            </div>
                                        ))}
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between pt-1">
                                            <p className="text-xs text-muted-foreground">Hal {page}/{totalPages}</p>
                                            <div className="flex gap-1">
                                                <Button size="icon-sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                                                    <ChevronLeft className="h-3 w-3" />
                                                </Button>
                                                <Button size="icon-sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                                                    <ChevronRight className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}