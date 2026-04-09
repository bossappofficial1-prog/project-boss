"use client";

import React from "react";
import { Minus, Plus, Trash2, Calendar, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
const dateFmt = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "2-digit", month: "short", year: "numeric" });
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
    const totalItems = items.reduce((sum, line) => sum + line.quantity, 0);

    if (items.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border py-12 text-center">
                <p className="text-sm text-muted-foreground">Keranjang kosong</p>
                <p className="text-xs text-muted-foreground/80">
                    Pilih produk untuk menambahkan ke keranjang
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                    {totalItems} item
                </p>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="h-7 text-xs text-destructive hover:text-destructive/90">
                    Hapus Semua
                </Button>
            </div>

            <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                {items.map((line) => {
                    const isService = line.product.type === "SERVICE";
                    const lineTotal = line.product.price * line.quantity;
                    const hasSchedule = isService && line.bookingStart && line.bookingEnd;

                    return (
                        <div
                            key={line.product.id}
                            className="flex flex-col gap-2 rounded-md border border-border bg-card p-2.5">
                            <div className="flex items-center gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground">
                                        {line.product.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Rp {fmt.format(line.product.price)} × {line.quantity}
                                    </p>
                                </div>

                                <p className="whitespace-nowrap text-sm font-semibold text-foreground">
                                    Rp {fmt.format(lineTotal)}
                                </p>

                                {isService ? (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
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
                                        <span className="w-6 text-center text-sm font-semibold">
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
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            onClick={() => onRemove(line.product.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Service schedule section */}
                            {isService && (
                                <div className="flex flex-col gap-2">
                                    {hasSchedule ? (
                                        <div className="rounded border border-border bg-muted/30 p-2 text-xs text-muted-foreground">
                                            <p className="mb-0.5 flex items-center gap-1 font-semibold text-foreground">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {dateFmt.format(new Date(line.bookingStart!))}
                                            </p>
                                            <p className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                                                <Clock className="h-3 w-3" />
                                                {timeFmt.format(new Date(line.bookingStart!))} - {timeFmt.format(new Date(line.bookingEnd!))}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 rounded border border-dashed border-amber-500/50 bg-amber-500/5 p-2 text-xs text-amber-600 dark:text-amber-400">
                                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                            Jadwal layanan belum dipilih
                                        </div>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="w-full"
                                        onClick={() => onScheduleService?.(line.product.id)}>
                                        {hasSchedule ? "Ubah Jadwal" : "Pilih Jadwal"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <Separator />

            <div className="flex items-center justify-between text-base font-bold text-foreground">
                <span>Total</span>
                <span>Rp {fmt.format(subtotal)}</span>
            </div>
        </div>
    );
}
