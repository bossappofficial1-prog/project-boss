"use client";

import React, { useState } from "react";
import { Search, ShoppingBag, Clock, Ticket, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveUploadImageUrl } from "@/lib/url";
import type { PosV2Product } from "@/lib/apis/pos-v2";
import { OutletType } from "@/types";

type FilterType = "ALL" | "GOODS" | "SERVICE" | "TICKET";

interface ProductCatalogProps {
    products: PosV2Product[];
    isLoading: boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAddToCart: (product: PosV2Product) => void;
    cartQuantities: Record<string, number>;
    outletType?: OutletType;
}

const FILTER_LABELS: Record<FilterType, string> = {
    ALL: "Semua",
    GOODS: "Barang",
    SERVICE: "Layanan",
    TICKET: "Tiket",
};

export function ProductCatalog({
    products,
    isLoading,
    searchQuery,
    onSearchChange,
    onAddToCart,
    cartQuantities,
    outletType = OutletType.CUSTOM,
}: ProductCatalogProps) {
    const [filter, setFilter] = useState<FilterType>("ALL");

    const filtered = filter === "ALL" ? products : products.filter((p) => p.type === filter);

    const availableFilters = React.useMemo((): FilterType[] => {
        if (outletType === OutletType.RETAIL) return ["ALL", "GOODS"];
        if (outletType === OutletType.SERVICE) return ["ALL", "SERVICE"];
        if (outletType === OutletType.EVENT) return ["ALL", "TICKET"];
        if (outletType === OutletType.FNB) return ["ALL", "GOODS", "SERVICE"];
        return ["ALL", "GOODS", "SERVICE", "TICKET"];
    }, [outletType]);

    return (
        <div className="flex flex-col gap-4">
            {/* Search + Filter */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari produk atau layanan..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10 h-10"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
                    {availableFilters.map((f) => (
                        <Button
                            key={f}
                            size="sm"
                            variant={filter === f ? "default" : "outline"}
                            onClick={() => setFilter(f)}
                            className="shrink-0 font-semibold uppercase tracking-tight text-xs">
                            {FILTER_LABELS[f]}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-48 rounded-lg" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        {searchQuery
                            ? <Search className="h-5 w-5 text-muted-foreground" />
                            : <Package className="h-5 w-5 text-muted-foreground" />
                        }
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                            {searchQuery ? "Produk tidak ditemukan" : "Belum ada produk"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {searchQuery
                                ? `Tidak ada hasil untuk "${searchQuery}"`
                                : "Tambahkan produk aktif untuk mulai berjualan"}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 max-h-[80vh] overflow-y-auto gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {filtered.map((product) => {
                        const qty = cartQuantities[product.id] ?? 0;
                        const isGoods = product.type === "GOODS";
                        const isTicket = product.type === "TICKET";
                        const outOfStock = isGoods && (product.stock ?? 0) <= 0;
                        const ticketSoldOut =
                            isTicket &&
                            (product.totalQuota ?? 0) > 0 &&
                            (product.soldCount ?? 0) >= (product.totalQuota ?? 0);
                        const disabled = outOfStock || ticketSoldOut;
                        const imageUrl = resolveUploadImageUrl(product.image ?? undefined);
                        const remaining = isTicket
                            ? (product.totalQuota ?? 0) - (product.soldCount ?? 0)
                            : null;

                        return (
                            <button
                                key={product.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => onAddToCart(product)}
                                className={`group relative flex flex-col overflow-hidden rounded-lg border text-left
                                    ${disabled
                                        ? "cursor-not-allowed border-border bg-muted/20 opacity-55"
                                        : "border-border bg-card hover:border-primary/40 hover:shadow-md active:scale-[0.98]"
                                    }`}>

                                {/* Image area */}
                                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/30">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={product.name}
                                            loading="lazy"
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).style.display = "none";
                                                e.currentTarget.nextElementSibling?.classList.remove("hidden");
                                            }}
                                        />
                                    ) : null}

                                    {/* Fallback icon */}
                                    <div className={`flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground/50 ${imageUrl ? "hidden" : ""}`}>
                                        <ShoppingBag className="h-7 w-7" />
                                    </div>

                                    {/* Sold out / habis overlay */}
                                    {disabled && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
                                            <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                                                {outOfStock ? "Habis" : "Sold Out"}
                                            </span>
                                        </div>
                                    )}

                                    {/* Type badge */}
                                    <Badge
                                        variant={isGoods ? "default" : isTicket ? "outline" : "secondary"}
                                        className="absolute left-1.5 top-1.5 rounded-sm px-1.5 text-xs">
                                        {isGoods ? "Barang" : isTicket ? "Tiket" : "Jasa"}
                                    </Badge>

                                    {/* Cart qty badge */}
                                    {qty > 0 && (
                                        <span className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground shadow-sm tabular-nums">
                                            {qty}
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex flex-1 flex-col gap-1.5 p-2.5">
                                    <p className="line-clamp-2 text-sm font-medium leading-tight text-foreground">
                                        {product.name}
                                    </p>
                                    <p className="text-xs font-bold text-primary">
                                        Rp {product.price.toLocaleString("id-ID")}
                                    </p>

                                    {/* Meta info */}
                                    {isGoods && !outOfStock && (
                                        <p className="text-xs text-muted-foreground">
                                            Stok: <span className="font-medium text-foreground">{product.stock}</span>
                                            {product.unit ? ` ${product.unit}` : ""}
                                        </p>
                                    )}
                                    {isTicket && !ticketSoldOut && remaining !== null && (
                                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Ticket className="h-3 w-3" />
                                            <span>
                                                <span className="font-medium text-foreground">{remaining}</span> tersisa
                                            </span>
                                        </p>
                                    )}
                                    {!isGoods && !isTicket && (
                                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {product.durationMinutes ?? 0} menit
                                        </p>
                                    )}
                                </div>

                                {/* In-cart indicator bar */}
                                {qty > 0 && (
                                    <div className="h-0.5 w-full bg-primary" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}