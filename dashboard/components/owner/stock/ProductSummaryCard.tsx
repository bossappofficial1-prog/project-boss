"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, TrendingUp, DollarSign, Layers, Scale } from "lucide-react";
import type { ProductGoodsInfo } from "@/hooks/useStockHistory";

interface ProductSummaryCardProps {
  productInfo: ProductGoodsInfo;
  formatCurrency: (amount: number | null) => string;
}

export default function ProductSummaryCard({
  productInfo,
  formatCurrency,
}: ProductSummaryCardProps) {
  const margin = productInfo.sellingPrice - productInfo.averageHpp;
  const marginPercent =
    productInfo.averageHpp > 0 ? ((margin / productInfo.averageHpp) * 100).toFixed(1) : "0";
  const isLowStock =
    productInfo.minStock !== null && productInfo.currentStock <= productInfo.minStock;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            {productInfo.product.name}
          </CardTitle>
          <Badge variant={productInfo.product.status === "ACTIVE" ? "success" : "secondary"}>
            {productInfo.product.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
        {productInfo.product.description && (
          <p className="text-sm text-muted-foreground">{productInfo.product.description}</p>
        )}
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-md bg-muted/50 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-primary">
              <Layers className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Stok Saat Ini</span>
            </div>
            <p className="text-lg font-bold tabular-nums">
              {productInfo.currentStock}{" "}
              <span className="text-xs font-normal text-muted-foreground">{productInfo.unit}</span>
            </p>
            {isLowStock && (
              <p className="mt-0.5 text-xs text-destructive">Stok rendah!</p>
            )}
          </div>

          <div className="rounded-md bg-muted/50 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <Scale className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">HPP Rata-rata</span>
            </div>
            <p className="text-lg font-bold tabular-nums">{formatCurrency(productInfo.averageHpp)}</p>
          </div>

          <div className="rounded-md bg-muted/50 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Harga Jual</span>
            </div>
            <p className="text-lg font-bold tabular-nums">{formatCurrency(productInfo.sellingPrice)}</p>
          </div>

          <div className="rounded-md bg-muted/50 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Margin</span>
            </div>
            <p className="text-lg font-bold tabular-nums">{formatCurrency(margin)}</p>
            <p className="text-xs text-muted-foreground">({marginPercent}%)</p>
          </div>

          <div className="rounded-md bg-muted/50 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
              <Package className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Satuan</span>
            </div>
            <p className="text-lg font-bold">{productInfo.unit}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
