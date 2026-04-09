"use client";

import React, { useState } from "react";
import { Search, ShoppingBag, Clock, Ticket } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveUploadImageUrl } from "@/lib/url";
import type { PosV2Product } from "@/lib/apis/pos-v2";

type FilterType = "ALL" | "GOODS" | "SERVICE" | "TICKET";

interface ProductCatalogProps {
    products: PosV2Product[];
    isLoading: boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAddToCart: (product: PosV2Product) => void;
    cartQuantities: Record<string, number>;
}

export function ProductCatalog({
    products,
    isLoading,
    searchQuery,
    onSearchChange,
    onAddToCart,
    cartQuantities,
}: ProductCatalogProps) {
    const [filter, setFilter] = useState<FilterType>("ALL");

    const filtered = filter === "ALL" ? products : products.filter((p) => p.type === filter);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari produk atau layanan..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {(["ALL", "GOODS", "SERVICE", "TICKET"] as FilterType[]).map((f) => (
                        <Button
                            key={f}
                            size="sm"
                            variant={filter === f ? "default" : "outline"}
                            onClick={() => setFilter(f)}
                            className={filter === f ? "bg-primary hover:bg-primary/90" : ""}>
                            {f === "ALL" ? "Semua" : f === "GOODS" ? "Barang" : f === "SERVICE" ? "Layanan" : "Tiket"}
                        </Button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-44 rounded-md" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                    {searchQuery ? "Tidak ada produk yang cocok" : "Belum ada produk aktif"}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {filtered.map((product) => {
                        const qty = cartQuantities[product.id] ?? 0;
                        const isGoods = product.type === "GOODS";
                        const isTicket = product.type === "TICKET";
                        const outOfStock = isGoods && (product.stock ?? 0) <= 0;
                        const ticketSoldOut = isTicket && (product.totalQuota ?? 0) > 0 && ((product.soldCount ?? 0) >= (product.totalQuota ?? 0));
                        const disabled = outOfStock || ticketSoldOut;
                        const imageUrl = resolveUploadImageUrl(product.image ?? undefined);

                        return (
                            <button
                                key={product.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => onAddToCart(product)}
                                className={`relative flex flex-col overflow-hidden rounded-md border text-left transition-all
                                    ${disabled
                                        ? "cursor-not-allowed border-border bg-muted/30 opacity-60"
                                        : "border-border bg-card hover:border-primary/50 hover:shadow-md active:scale-[0.98]"
                                    }`}>
                                {/* Image */}
                                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/20">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={product.name}
                                            loading="lazy"
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).style.display = "none";
                                                e.currentTarget.nextElementSibling?.classList.remove("hidden");
                                            }}
                                        />
                                    ) : null}
                                    <div className={`flex h-full w-full items-center justify-center text-muted-foreground ${imageUrl ? "hidden" : ""}`}>
                                        <ShoppingBag className="h-8 w-8" />
                                    </div>

                                    {/* Type badge */}
                                    <Badge
                                        variant="secondary"
                                        className={`absolute right-1.5 top-1.5 text-[10px] ${isGoods
                                            ? "bg-primary/10 text-primary"
                                            : isTicket
                                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                            }`}>
                                        {isGoods ? "Barang" : isTicket ? "Tiket" : "Jasa"}
                                    </Badge>

                                    {/* Cart badge */}
                                    {qty > 0 && (
                                        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground shadow-sm">
                                            {qty}
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex flex-1 flex-col gap-1 p-2.5">
                                    <p className="line-clamp-2 text-sm font-medium text-foreground">
                                        {product.name}
                                    </p>
                                    <p className="text-xs font-semibold text-primary">
                                        Rp {product.price.toLocaleString("id-ID")}
                                    </p>
                                    {isGoods ? (
                                        <p className={`text-[11px] ${outOfStock ? "text-destructive" : "text-muted-foreground"}`}>
                                            {outOfStock ? "Habis" : `Stok: ${product.stock} ${product.unit ?? ""}`}
                                        </p>
                                    ) : isTicket ? (
                                        <p className={`flex items-center gap-1 text-[11px] ${ticketSoldOut ? "text-destructive" : "text-muted-foreground"}`}>
                                            <Ticket className="h-3 w-3" />
                                            {ticketSoldOut ? "Sold Out" : `${(product.totalQuota ?? 0) - (product.soldCount ?? 0)} tersisa`}
                                        </p>
                                    ) : (
                                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {product.durationMinutes ?? 0} menit
                                        </p>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
