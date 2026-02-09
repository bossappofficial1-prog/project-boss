"use client";

import React, { useState } from "react";
import { Search, ShoppingBag, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveUploadImageUrl } from "@/lib/url";
import type { PosV2Product } from "@/lib/apis/pos-v2";

type FilterType = "ALL" | "GOODS" | "SERVICE";

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
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Cari produk atau layanan..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {(["ALL", "GOODS", "SERVICE"] as FilterType[]).map((f) => (
                        <Button
                            key={f}
                            size="sm"
                            variant={filter === f ? "default" : "outline"}
                            onClick={() => setFilter(f)}
                            className={filter === f ? "bg-blue-600 hover:bg-blue-500" : ""}>
                            {f === "ALL" ? "Semua" : f === "GOODS" ? "Barang" : "Layanan"}
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
                <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    {searchQuery ? "Tidak ada produk yang cocok" : "Belum ada produk aktif"}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {filtered.map((product) => {
                        const qty = cartQuantities[product.id] ?? 0;
                        const isGoods = product.type === "GOODS";
                        const outOfStock = isGoods && (product.stock ?? 0) <= 0;
                        const imageUrl = resolveUploadImageUrl(product.image ?? undefined);

                        return (
                            <button
                                key={product.id}
                                type="button"
                                disabled={outOfStock}
                                onClick={() => onAddToCart(product)}
                                className={`relative flex flex-col overflow-hidden rounded-md border text-left transition-all
                  ${outOfStock
                                        ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-900/40"
                                        : "border-slate-200 bg-white hover:border-blue-400 hover:shadow-md active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-500"
                                    }`}>
                                {/* Image */}
                                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
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
                                    <div className={`flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-600 ${imageUrl ? "hidden" : ""}`}>
                                        <ShoppingBag className="h-8 w-8" />
                                    </div>

                                    {/* Type badge */}
                                    <Badge
                                        className={`absolute right-1.5 top-1.5 text-[10px] ${isGoods
                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                                            : "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300"
                                            }`}>
                                        {isGoods ? "Barang" : "Jasa"}
                                    </Badge>

                                    {/* Cart badge */}
                                    {qty > 0 && (
                                        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-bold text-white shadow-sm">
                                            {qty}
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex flex-1 flex-col gap-1 p-2.5">
                                    <p className="line-clamp-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                                        {product.name}
                                    </p>
                                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                        Rp {product.price.toLocaleString("id-ID")}
                                    </p>
                                    {isGoods ? (
                                        <p className={`text-[11px] ${outOfStock ? "text-red-500" : "text-slate-500 dark:text-slate-400"}`}>
                                            {outOfStock ? "Habis" : `Stok: ${product.stock} ${product.unit ?? ""}`}
                                        </p>
                                    ) : (
                                        <p className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
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
