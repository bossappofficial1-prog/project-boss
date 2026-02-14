"use client";

import React from "react";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { POBCartItem } from "@/hooks/api/use-pob-v2";

interface CartPanelProps {
    items: POBCartItem[];
    transactionType: "PURCHASE" | "RETURN";
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onUpdateHpp: (productId: string, hpp: number) => void;
    onRemove: (productId: string) => void;
    onClear: () => void;
}

const currencyFmt = new Intl.NumberFormat("id-ID");

export function CartPanel({
    items,
    transactionType,
    onUpdateQuantity,
    onUpdateHpp,
    onRemove,
    onClear,
}: CartPanelProps) {
    const isPurchase = transactionType === "PURCHASE";

    const totalEstimate = React.useMemo(
        () => items.reduce((sum, i) => sum + i.quantity * i.hppPerUnit, 0),
        [items],
    );

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-12 text-center">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                    Pilih barang dari katalog
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                    {items.length} barang dipilih
                </p>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={onClear}>
                    Hapus Semua
                </Button>
            </div>

            <ScrollArea className="max-h-[280px] lg:max-h-[350px] overflow-y-scroll scroll-hide">
                <div className="space-y-3 pr-3">
                    {items.map((item) => {
                        const unit = item.product.goods?.unit ?? "pcs";
                        const subtotal = item.quantity * item.hppPerUnit;

                        return (
                            <div
                                key={item.product.id}
                                className="rounded-md border bg-card p-3 space-y-2.5"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium leading-tight truncate">
                                            {item.product.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Stok: {item.product.goods?.currentStock ?? 0} {unit}
                                        </p>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                                        onClick={() => onRemove(item.product.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                            Jumlah
                                        </label>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-8 w-8 shrink-0"
                                                onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <Input
                                                type="number"
                                                min={1}
                                                className="h-8 text-center [&::-webkit-inner-spin-button]:appearance-none"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    if (!isNaN(val) && val >= 1) onUpdateQuantity(item.product.id, val);
                                                }}
                                            />
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-8 w-8 shrink-0"
                                                onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    {isPurchase && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                                HPP / {unit}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                                    Rp
                                                </span>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    className="h-8 pl-8 text-right [&::-webkit-inner-spin-button]:appearance-none"
                                                    value={item.hppPerUnit || ""}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        onUpdateHpp(item.product.id, isNaN(val) ? 0 : val);
                                                    }}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {isPurchase && (
                                    <p className="text-right text-xs text-muted-foreground">
                                        Subtotal: Rp {currencyFmt.format(subtotal)}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>

            <Separator />

            {isPurchase && (
                <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Total Estimasi</span>
                    <span>Rp {currencyFmt.format(totalEstimate)}</span>
                </div>
            )}
        </div>
    );
}
