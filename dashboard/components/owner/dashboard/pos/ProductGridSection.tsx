import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Search, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { resolveUploadImageUrl } from "@/lib/url";
import type { POSProduct } from "@/types/pos";
import { formatCurrency } from "@/lib/utils";

export interface ProductGridSectionProps {
  filteredProducts: POSProduct[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  activeFilter: "ALL" | "GOODS" | "SERVICE";
  onFilterChange: (filter: "ALL" | "GOODS" | "SERVICE") => void;
  isLoading: boolean;
  onAddProduct: (product: POSProduct) => void;
  cartQuantities: Record<string, number>;
  hideFilters?: boolean;
}

const FILTER_OPTIONS: Array<{ value: "ALL" | "GOODS" | "SERVICE"; label: string }> = [
  { value: "ALL", label: "Semua" },
  { value: "GOODS", label: "Produk" },
  { value: "SERVICE", label: "Layanan" },
];

const ITEMS_PER_PAGE = 6;

export function ProductGridSection({
  filteredProducts,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  activeFilter,
  onFilterChange,
  isLoading,
  onAddProduct,
  cartQuantities,
  hideFilters,
}: ProductGridSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage((prev) => {
      const next = Math.min(Math.max(prev, 1), totalPages);
      return next === prev ? prev : next;
    });
  }, [totalPages]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const pageStart = totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = totalItems === 0 ? 0 : Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
  const showPagination = totalItems > 0;

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors h-fit dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center gap-2 sm:max-w-xl">
          <Input
            placeholder="Cari produk atau layanan..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSearch();
              }
            }}
            className="flex-1 border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <Button onClick={onSearch} className="gap-2 bg-red-600 hover:bg-red-500">
            <Search className="h-4 w-4" />
            Cari
          </Button>
        </div>
        {!hideFilters && (
          <div className="flex items-center gap-2">
            {FILTER_OPTIONS.map((filter) => (
              <Button
                key={filter.value}
                variant={activeFilter === filter.value ? "default" : "secondary"}
                className={
                  activeFilter === filter.value
                    ? "bg-red-600 hover:bg-red-500"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800"
                }
                onClick={() => onFilterChange(filter.value)}>
                {filter.label}
              </Button>
            ))}
          </div>
        )}
      </div>
      <div className="relative min-h-[200px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 grid place-items-center rounded-xl border border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Search className="h-4 w-4 animate-spin" />
              Memuat produk...
            </div>
          </div>
        )}

        {filteredProducts.length === 0 && !isLoading ? (
          <div className="grid h-[280px] place-items-center text-sm text-slate-500 dark:text-slate-400">
            Produk tidak ditemukan. Coba ubah kata kunci atau filter.
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedProducts.map((product) => {
                const productImage = resolveUploadImageUrl(product.image ?? undefined);
                const quantityInCart = cartQuantities[product.id] ?? 0;
                const isOutOfStock =
                  product.type === "GOODS" && (product.goods?.currentStock ?? 0) <= 0;

                return (
                  <Card
                    key={product.id}
                    className="flex h-full flex-col p-0 justify-between border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
                    <CardContent className="space-y-2 p-4">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-900">
                        {productImage ? (
                          <img
                            src={productImage}
                            alt={product.name}
                            loading="lazy"
                            className="object-cover w-full h-full"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            onError={(event) => {
                              const target = event.currentTarget as HTMLImageElement;
                              target.src =
                                "https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png";
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-600">
                            <ShoppingBag className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium leading-snug text-slate-900 line-clamp-2 dark:text-slate-100">
                            {product.name}
                          </p>
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {product.type === "SERVICE" ? "Layanan" : "Produk"}
                          </Badge>
                        </div>
                        {product.type === "GOODS" ? (
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Stok: {product.goods?.currentStock ?? 0}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Durasi ± {product.service?.durationMinutes ?? 0} menit
                          </p>
                        )}
                        <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(
                            product.type === "GOODS"
                              ? (product.goods?.sellingPrice ?? 0)
                              : (product.service?.sellingPrice ?? 0),
                          )}
                        </p>
                      </div>
                    </CardContent>
                    <div className="flex items-center justify-between border-t border-slate-200 p-4 dark:border-slate-800">
                      <Button
                        size="sm"
                        className="flex-1 bg-red-600 hover:bg-red-500"
                        disabled={isOutOfStock}
                        onClick={() => onAddProduct(product)}>
                        {isOutOfStock ? "Stok habis" : "Tambah"}
                      </Button>
                      {quantityInCart > 0 && (
                        <span className="ml-3 text-xs text-slate-500 dark:text-slate-400">
                          keranjang: {quantityInCart}
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
            {showPagination && (
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Menampilkan {pageStart}-{pageEnd} dari {totalItems} produk
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                    aria-label="Halaman sebelumnya">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[48px] text-center text-xs font-medium sm:text-sm">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalItems === 0}
                    className="h-8 w-8 p-0"
                    aria-label="Halaman selanjutnya">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default ProductGridSection;
