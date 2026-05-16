"use client";

import React from "react";
import { Minus, Plus, Trash2, Calendar, Clock, AlertTriangle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { resolveUploadImageUrl } from "@/lib/url";
import type { PosV2Product } from "@/lib/apis/pos-v2";

export interface CartLine {
    product: PosV2Product;
    quantity: number;
    bookingSlotId?: string;
    bookingStart?: string;
    bookingEnd?: string;
    staffId?: string;
}

interface CartPanelProps {
    items: CartLine[];
    onIncrease: (productId: string) => void;
    onDecrease: (productId: string) => void;
    onRemove: (productId: string) => void;
    onClear: () => void;
    onScheduleService?: (productId: string) => void;
}

const fmt = new Intl.NumberFormat("id-ID");
const dateFmt = new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });

export function CartPanel({
    items,
    onIncrease,
    onDecrease,
    onRemove,
    onClear,
    onScheduleService,
}: CartPanelProps) {
    const subtotal = items.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    const taxAmount = items.reduce(
        (sum, line) => sum + line.product.price * line.quantity * ((line.product.taxPercentage ?? 0) / 100),
        0,
    );
    const total = subtotal + taxAmount;
    const totalItems = items.reduce((sum, line) => sum + line.quantity, 0);
    const hasUnscheduled = items.some(
        (line) => line.product.type === "SERVICE" && (!line.bookingStart || !line.bookingEnd)
    );

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Keranjang kosong</p>
                    <p className="text-xs text-muted-foreground">
                        Pilih produk dari katalog untuk memulai transaksi
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{totalItems}</span> item dalam keranjang
                </p>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="h-7 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                    Hapus Semua
                </Button>
            </div>

            {/* Unscheduled warning banner */}
            {hasUnscheduled && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>Ada layanan yang belum dijadwalkan</span>
                </div>
            )}

            {/* Item list */}
            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-0.5">
                {items.map((line) => {
                    const isService = line.product.type === "SERVICE";
                    const isTicket = line.product.type === "TICKET";
                    const lineTotal = line.product.price * line.quantity;
                    const hasSchedule = isService && line.bookingStart && line.bookingEnd;
                    const imageUrl = resolveUploadImageUrl(line.product.image ?? undefined);

                    return (
                        <div
                            key={line.product.id}
                            className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-3">
                            {/* Product row */}
                            <div className="flex items-start gap-3">
                                {/* Thumbnail */}
                                {imageUrl && (
                                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                                        <img
                                            src={imageUrl}
                                            alt={line.product.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                )}

                                {/* Name + price */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-medium leading-tight text-foreground line-clamp-1">
                                            {line.product.name}
                                        </p>
                                        <p className="whitespace-nowrap text-sm font-bold text-foreground">
                                            Rp {fmt.format(lineTotal)}
                                        </p>
                                    </div>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Rp {fmt.format(line.product.price)}
                                        {line.quantity > 1 && ` × ${line.quantity}`}
                                    </p>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-between">
                                <Badge
                                    variant="secondary"
                                    className="text-xs rounded-sm">
                                    {isService ? "Jasa" : isTicket ? "Tiket" : "Barang"}
                                </Badge>

                                {isService ? (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => onRemove(line.product.id)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => onDecrease(line.product.id)}>
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-7 text-center text-sm font-bold tabular-nums">
                                            {line.quantity}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => onIncrease(line.product.id)}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => onRemove(line.product.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Service schedule section */}
                            {isService && (
                                <div className="flex flex-col gap-2 border-t border-border/50 pt-2.5">
                                    {hasSchedule ? (
                                        <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
                                            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                                <Calendar className="h-3.5 w-3.5 text-primary" />
                                                {dateFmt.format(new Date(line.bookingStart!))}
                                            </p>
                                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {timeFmt.format(new Date(line.bookingStart!))} –{" "}
                                                {timeFmt.format(new Date(line.bookingEnd!))}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                            Jadwal belum dipilih
                                        </div>
                                    )}
                                    <Button
                                        size="sm"
                                        variant={hasSchedule ? "outline" : "default"}
                                        className="w-full h-8 text-xs"
                                        onClick={() => onScheduleService?.(line.product.id)}>
                                        <Calendar className="h-3.5 w-3.5" />
                                        {hasSchedule ? "Ubah Jadwal" : "Pilih Jadwal"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <Separator />

            {/* Subtotal */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-sm font-medium text-foreground tabular-nums">
                    Rp {fmt.format(subtotal)}
                </span>
            </div>

            {/* Tax */}
            {taxAmount > 0 && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{items.find(it => it.product.taxName)?.product.taxName || "Pajak"}</span>
                    <span className="text-sm font-medium text-foreground tabular-nums">
                        Rp {fmt.format(taxAmount)}
                    </span>
                </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-base font-bold text-primary tabular-nums">
                    Rp {fmt.format(total)}
                </span>
            </div>
        </div>
    );
}