"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  Camera,
  Search,
  ScanBarcode,
  ShoppingBag,
  Clock,
  Ticket,
  Package,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveUploadImageUrl } from "@/lib/url";
import type { PosV2Product } from "@/lib/apis/pos-v2";
import { OutletType } from "@/types";

type FilterType = "ALL" | "GOODS" | "SERVICE" | "TICKET";

type CategoryOption = {
  id: string;
  name: string;
};

interface ProductCatalogProps {
  products: PosV2Product[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddToCart: (product: PosV2Product) => void;
  onScanBarcode: (code: string) => void;
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
  onScanBarcode,
  cartQuantities,
  outletType = OutletType.CUSTOM,
}: ProductCatalogProps) {
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [keyboardScanActive, setKeyboardScanActive] = useState(false);
  const [barcodeBuffer, setBarcodeBuffer] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const byType =
    filter === "ALL" ? products : products.filter((p) => p.type === filter);

  const filtered = categoryFilter
    ? byType.filter((p) => p.category?.id === categoryFilter)
    : byType;

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      if (p.category) map.set(p.category.id, p.category.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const availableFilters = useMemo((): FilterType[] => {
    if (outletType === OutletType.RETAIL || outletType === OutletType.FNB)
      return ["ALL", "GOODS"];
    if (outletType === OutletType.SERVICE) return ["ALL", "SERVICE"];
    if (outletType === OutletType.EVENT) return ["ALL", "TICKET"];
    return ["ALL", "GOODS", "SERVICE", "TICKET"];
  }, [outletType]);

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    setCategoryFilter(null);
  };

  const canScanGoods = availableFilters.includes("GOODS");

  useEffect(() => {
    if (keyboardScanActive) {
      scannerInputRef.current?.focus();
    }
  }, [keyboardScanActive]);

  useEffect(() => {
    if (!cameraOpen || !videoRef.current) return;

    let cancelled = false;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader
      .decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, _err, controls) => {
          if (cancelled) {
            controls?.stop();
            return;
          }

          if (result?.getText()) {
            onScanBarcode(result.getText());
            controls?.stop();
            setCameraOpen(false);
            setKeyboardScanActive(false);
            setBarcodeBuffer("");
          }
        },
      )
      .catch(() => {
        setCameraOpen(false);
      });

    return () => {
      cancelled = true;
      readerRef.current = null;
    };
  }, [cameraOpen, onScanBarcode]);

  const handleScannerKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (!keyboardScanActive) return;

    if (event.key === "Enter") {
      event.preventDefault();
      const code = barcodeBuffer.trim();
      if (code) {
        onScanBarcode(code);
      }
      setBarcodeBuffer("");
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      setBarcodeBuffer((prev) => prev.slice(0, -1));
      return;
    }

    if (event.key.length === 1) {
      setBarcodeBuffer((prev) => `${prev}${event.key}`);
    }
  };

  const handleEnableScanner = () => {
    if (!canScanGoods) return;
    setCameraOpen(false);
    setKeyboardScanActive(true);
    setTimeout(() => scannerInputRef.current?.focus(), 0);
  };

  const handleOpenCamera = () => {
    if (!canScanGoods) return;
    setKeyboardScanActive(false);
    setBarcodeBuffer("");
    setCameraOpen(true);
  };

  return (
    <div className="flex flex-col gap-4" data-guide="product-catalog">
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
          {canScanGoods && (
            <>
              {/* <Button
                type="button"
                size="sm"
                variant={keyboardScanActive ? "default" : "outline"}
                onClick={handleEnableScanner}
                className="shrink-0 gap-1.5 font-semibold uppercase tracking-tight text-xs"
              >
                <ScanBarcode className="h-4 w-4" />
                Scan Barcode
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleOpenCamera}
                className="shrink-0 gap-1.5 font-semibold uppercase tracking-tight text-xs"
              >
                <Camera className="h-4 w-4" />
                Scan Kamera
              </Button> */}
            </>
          )}
          {availableFilters.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => handleFilterChange(f)}
              className="shrink-0 font-semibold uppercase tracking-tight text-xs"
            >
              {FILTER_LABELS[f]}
            </Button>
          ))}
        </div>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setCategoryFilter(null)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !categoryFilter
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                categoryFilter === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

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
            {searchQuery ? (
              <Search className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Package className="h-5 w-5 text-muted-foreground" />
            )}
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
            const outOfStock = isGoods && !product.hasRecipe && (product.stock ?? 0) <= 0;
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
                                    ${
                                      disabled
                                        ? "cursor-not-allowed border-border bg-muted/20 opacity-55"
                                        : "border-border bg-card hover:border-primary/40 hover:shadow-md active:scale-[0.98]"
                                    }`}
              >
                {/* Image area */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-muted/30">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                        e.currentTarget.nextElementSibling?.classList.remove(
                          "hidden",
                        );
                      }}
                    />
                  ) : null}

                  {/* Fallback icon */}
                  <div
                    className={`flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground/50 ${imageUrl ? "hidden" : ""}`}
                  >
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
                    variant={
                      isGoods ? "default" : isTicket ? "outline" : "secondary"
                    }
                    className="absolute left-1.5 top-1.5 rounded-sm px-1.5 text-xs"
                  >
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
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-primary">
                      Rp {product.price.toLocaleString("id-ID")}
                    </p>
                    {product.taxPercentage ? (
                      <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30 px-1 py-0.5 rounded border border-amber-500/20">
                        +{product.taxName || "Pajak"} {product.taxPercentage}%
                      </span>
                    ) : null}
                  </div>

                  {/* Meta info */}
                  {isGoods && !product.hasRecipe && !outOfStock && (
                    <p className="text-xs text-muted-foreground">
                      Stok:{" "}
                      <span className="font-medium text-foreground">
                        {product.stock}
                      </span>
                      {product.unit ? ` ${product.unit}` : ""}
                    </p>
                  )}
                  {isTicket && !ticketSoldOut && remaining !== null && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Ticket className="h-3 w-3" />
                      <span>
                        <span className="font-medium text-foreground">
                          {remaining}
                        </span>{" "}
                        tersisa
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
                {qty > 0 && <div className="h-0.5 w-full bg-primary" />}
              </button>
            );
          })}
        </div>
      )}

      <input
        ref={scannerInputRef}
        type="text"
        inputMode="none"
        autoComplete="off"
        value={barcodeBuffer}
        onChange={() => undefined}
        onKeyDown={handleScannerKeyDown}
        className="absolute h-0 w-0 opacity-0 pointer-events-none"
        aria-hidden="true"
        tabIndex={-1}
      />

      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border border-border bg-card p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-medium">Scan Kamera</h3>
                <p className="text-xs text-muted-foreground">
                  Arahkan kamera ke barcode atau QR code.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-md"
                onClick={() => setCameraOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-border bg-muted/30">
              <video
                ref={videoRef}
                className="h-72 w-full object-cover"
                muted
                playsInline
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
