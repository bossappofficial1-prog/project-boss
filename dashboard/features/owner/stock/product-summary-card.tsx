"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, DollarSign, Layers, Scale } from "lucide-react";
import type { ProductGoodsInfo } from "@/hooks/use-stock-history";
import { cn } from "@/lib/utils";

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
    <Card className="rounded-md gap-0 py-0 border border-border/80 bg-background shadow-sm overflow-hidden">
      <CardHeader className="p-4 border-b border-border/40 bg-muted/30">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-background border border-border shadow-sm">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-foreground/90">
                {productInfo.product.name}
              </CardTitle>
              <CardDescription className="text-[10px] font-medium uppercase tracking-tighter opacity-70">
                Detail ringkasan statistik produk
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={cn(
            "px-2 py-0.5 rounded-md text-[10px] font-bold shadow-none",
            productInfo.product.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"
          )}>
            {productInfo.product.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-md border border-border/60 bg-muted/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground opacity-70">
              <Layers className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold">Stok Saat Ini</span>
            </div>
            <p className={cn(
              "text-xl font-bold tabular-nums tracking-tight",
              isLowStock ? "text-rose-600" : "text-foreground/90"
            )}>
              {productInfo.currentStock}{" "}
              <span className="text-[10px] font-medium text-muted-foreground uppercase">{productInfo.unit}</span>
            </p>
            {isLowStock && (
              <Badge variant="outline" className="text-[8px] font-bold uppercase px-1 py-0 border-rose-500/20 bg-rose-500/5 text-rose-600">Low Stock</Badge>
            )}
          </div>

          <div className="rounded-md border border-border/60 bg-muted/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 opacity-70">
              <Scale className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold">HPP Rata-rata</span>
            </div>
            <p className="text-xl font-bold tabular-nums text-foreground/90 tracking-tight">{formatCurrency(productInfo.averageHpp)}</p>
          </div>

          <div className="rounded-md border border-border/60 bg-muted/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 opacity-70">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold">Harga Jual</span>
            </div>
            <p className="text-xl font-bold tabular-nums text-foreground/90 tracking-tight">{formatCurrency(productInfo.sellingPrice)}</p>
          </div>

          <div className="rounded-md border border-border/60 bg-muted/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 opacity-70">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold">Margin</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-xl font-bold tabular-nums text-foreground/90 tracking-tight">{formatCurrency(margin)}</p>
              <p className="text-[10px] font-bold text-muted-foreground opacity-60">({marginPercent}%)</p>
            </div>
          </div>

          <div className="rounded-md border border-border/60 bg-muted/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground opacity-70">
              <Package className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold">Satuan</span>
            </div>
            <p className="text-xl font-bold text-foreground/90 tracking-tight uppercase">{productInfo.unit}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
