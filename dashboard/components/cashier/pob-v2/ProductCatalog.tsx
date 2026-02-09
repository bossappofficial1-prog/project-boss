"use client";

import React from "react";
import { Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { resolveUploadImageUrl } from "@/lib/url";
import type { POBProduct } from "@/hooks/api/use-pob-v2";

interface ProductCatalogProps {
    products: POBProduct[];
    isLoading: boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSelectProduct: (product: POBProduct) => void;
    cartQuantities: Record<string, number>;
}

const currencyFmt = new Intl.NumberFormat("id-ID");

export function ProductCatalog({
    products,
    isLoading,
    searchQuery,
    onSearchChange,
    onSelectProduct,
    cartQuantities,
}: ProductCatalogProps) {
    return (
        <div className="flex flex-col gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Cari barang..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10"
                />
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-40 rounded-md" />
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                    {searchQuery ? "Tidak ada barang yang cocok" : "Belum ada barang aktif"}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {products.map((product) => {
                        const qty = cartQuantities[product.id] ?? 0;
                        const stock = product.goods?.currentStock ?? 0;
                        const unit = product.goods?.unit ?? "pcs";
                        const hpp = product.goods?.averageHpp ?? 0;
                        const imageUrl = resolveUploadImageUrl(product.image);

                        return (
                            <button
                                key={product.id}
                                type="button"
                                onClick={() => onSelectProduct(product)}
                                className="group relative flex flex-col overflow-hidden rounded-md border bg-card text-left transition-all hover:shadow-md hover:border-primary/40 active:scale-[0.98]"
                            >
                                {qty > 0 && (
                                    <div className="absolute right-2 top-2 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                                        {qty}
                                    </div>
                                )}

                                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={product.name}
                                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <Package className="h-8 w-8 text-muted-foreground/40" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-1 flex-col gap-1 p-2.5">
                                    <p className="text-sm font-medium leading-tight line-clamp-2">
                                        {product.name}
                                    </p>
                                    <div className="mt-auto flex items-center justify-between gap-1">
                                        <Badge
                                            variant={stock > 0 ? "secondary" : "destructive"}
                                            className="text-[10px] px-1.5"
                                        >
                                            {stock} {unit}
                                        </Badge>
                                        {hpp > 0 && (
                                            <span className="text-[10px] text-muted-foreground">
                                                HPP: {currencyFmt.format(hpp)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
