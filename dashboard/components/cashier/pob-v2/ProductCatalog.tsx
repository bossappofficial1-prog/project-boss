"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search, Package, Plus, Minus, ScanLine, AlertTriangle, Barcode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveUploadImageUrl } from "@/lib/url";
import type { POBProduct } from "@/hooks/api/use-pob-v2";
import { cn } from "@/lib/utils";

interface ProductCatalogProps {
    products: POBProduct[];
    isLoading: boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSelectProduct: (product: POBProduct) => void;
    onIncrementProduct?: (product: POBProduct) => void;
    onDecrementProduct?: (productId: string) => void;
    cartQuantities: Record<string, number>;
    onScanBarcode?: (barcode: string) => void;
}

const currencyFmt = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

export function ProductCatalog({
    products,
    isLoading,
    searchQuery,
    onSearchChange,
    onSelectProduct,
    onIncrementProduct,
    onDecrementProduct,
    cartQuantities,
    onScanBarcode,
}: ProductCatalogProps) {
    const [barcodeMode, setBarcodeMode] = useState(false);
    const [barcodeBuffer, setBarcodeBuffer] = useState("");
    const barcodeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (barcodeMode) {
            barcodeInputRef.current?.focus();
        }
    }, [barcodeMode]);

    const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const code = barcodeBuffer.trim();
            if (code && onScanBarcode) {
                onScanBarcode(code);
            }
            setBarcodeBuffer("");
            setBarcodeMode(false);
        }
    };

    const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setBarcodeBuffer(val);

        if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
        barcodeTimerRef.current = setTimeout(() => {
            if (val.trim() && onScanBarcode) {
                onScanBarcode(val.trim());
            }
            setBarcodeBuffer("");
            setBarcodeMode(false);
        }, 150);
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Search and Scan Barcode Header */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari barang atau scan barcode..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 h-10 text-sm bg-background border-input rounded-md"
                    />
                </div>
                
                <div className="flex items-center gap-2 shrink-0 justify-end">
                    {/* Standard pulsing ready scanner status */}
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Scanner Ready
                    </div>

                    {onScanBarcode && (
                        <Button
                            variant={barcodeMode ? "default" : "outline"}
                            size="icon"
                            className="shrink-0 h-10 w-10 rounded-md"
                            onClick={() => {
                                setBarcodeMode(!barcodeMode);
                                if (!barcodeMode) {
                                    setTimeout(() => barcodeInputRef.current?.focus(), 100);
                                }
                            }}
                            title="Scan Barcode"
                        >
                            <ScanLine className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Manual Barcode Input bar */}
            {barcodeMode && (
                <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-2 px-3">
                    <Barcode className="h-4 w-4 text-primary shrink-0" />
                    <Input
                        ref={barcodeInputRef}
                        placeholder="Scan atau ketik barcode..."
                        value={barcodeBuffer}
                        onChange={handleBarcodeChange}
                        onKeyDown={handleBarcodeKeyDown}
                        className="h-8 border-0 bg-transparent px-0 text-sm focus-visible:ring-0"
                        autoFocus
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs rounded-md"
                        onClick={() => {
                            setBarcodeMode(false);
                            setBarcodeBuffer("");
                        }}
                    >
                        Batal
                    </Button>
                </div>
            )}

            {/* Catalog Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-2 p-1.5 rounded-lg border border-border/50">
                            <Skeleton className="aspect-[4/3] w-full rounded-md" />
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="flex flex-col h-40 items-center justify-center rounded-lg border border-dashed border-border p-6 text-center bg-muted/10 gap-1.5">
                    <Package className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm font-semibold text-muted-foreground">
                        {searchQuery ? "Tidak ada barang yang cocok" : "Belum ada barang aktif"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {products.map((product) => {
                        const qty = cartQuantities[product.id] ?? 0;
                        const stock = product.goods?.currentStock ?? 0;
                        const minStock = product.goods?.minStock ?? 0;
                        const unit = product.goods?.unit ?? "pcs";
                        const hpp = product.goods?.averageHpp ?? 0;
                        const imageUrl = resolveUploadImageUrl(product.image);
                        const isLowStock = stock <= minStock;

                        return (
                            <div
                                key={product.id}
                                className={cn(
                                    "group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-all duration-200",
                                    qty > 0 
                                        ? "border-primary ring-1 ring-primary/20 bg-primary/[0.02]" 
                                        : "border-border hover:border-primary/40"
                                )}
                            >
                                {/* Floating Cart Quantity badge */}
                                {qty > 0 && (
                                    <div className="absolute right-2 top-2 z-10 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground shadow-sm">
                                        {qty}
                                    </div>
                                )}

                                {/* Product Image Button */}
                                <button
                                    type="button"
                                    onClick={() => onSelectProduct(product)}
                                    className="relative aspect-[4/3] w-full overflow-hidden bg-muted/20 active:scale-[0.98] transition-transform"
                                >
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={product.name}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <Package className="h-6 w-6 text-muted-foreground/30" />
                                        </div>
                                    )}
                                    
                                    {isLowStock && stock > 0 && (
                                        <div className="absolute left-1.5 top-1.5 z-10 flex items-center gap-1 rounded-sm bg-amber-500 p-1 px-1.5 text-[8px] font-bold text-white uppercase tracking-wider">
                                            <AlertTriangle className="h-3 w-3 shrink-0" />
                                            Stok Tipis
                                        </div>
                                    )}
                                </button>

                                {/* Product Details */}
                                <div className="flex flex-1 flex-col gap-1.5 p-3">
                                    <p className="text-xs font-semibold leading-tight line-clamp-2 text-foreground/90">
                                        {product.name}
                                    </p>
                                    
                                    <div className="mt-auto flex flex-col gap-1">
                                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-border/40">
                                            <Badge
                                                variant={stock > 0 ? (isLowStock ? "warning" : "secondary") : "destructive"}
                                                className={cn(
                                                    "text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm tracking-wide shadow-none",
                                                    stock > 0 
                                                        ? (isLowStock 
                                                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" 
                                                            : "bg-muted text-muted-foreground border-border") 
                                                        : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                                )}
                                            >
                                                {stock} {unit}
                                            </Badge>
                                            
                                            {hpp > 0 && (
                                                <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                                                    {currencyFmt.format(hpp)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Action Counter Controls */}
                                    {qty > 0 && onIncrementProduct && onDecrementProduct && (
                                        <div className="flex items-center gap-1.5 pt-1.5">
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-7 w-7 shrink-0 rounded-md hover:bg-destructive/5 hover:text-destructive border-border"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDecrementProduct(product.id);
                                                }}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <div className="flex-1 text-center text-xs font-bold text-foreground/90">
                                                {qty}
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-7 w-7 shrink-0 rounded-md hover:bg-primary/5 hover:text-primary border-border"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onIncrementProduct(product);
                                                }}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
