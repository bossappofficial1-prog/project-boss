"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            {productInfo.product.name}
          </CardTitle>
          <Badge
            variant={productInfo.product.status === "ACTIVE" ? "default" : "secondary"}
            className={
              productInfo.product.status === "ACTIVE"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : ""
            }>
            {productInfo.product.status}
          </Badge>
        </div>
        {productInfo.product.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {productInfo.product.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Current Stock */}
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <Layers className="h-4 w-4" />
              <span className="text-xs font-medium">Stok Saat Ini</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {productInfo.currentStock}{" "}
              <span className="text-sm font-normal text-gray-500">{productInfo.unit}</span>
            </p>
            {productInfo.minStock && productInfo.currentStock <= productInfo.minStock && (
              <p className="text-xs text-red-600 mt-1">⚠️ Stok rendah!</p>
            )}
          </div>

          {/* Average HPP */}
          <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
              <Scale className="h-4 w-4" />
              <span className="text-xs font-medium">HPP Rata-rata</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(productInfo.averageHpp)}
            </p>
          </div>

          {/* Selling Price */}
          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Harga Jual</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(productInfo.sellingPrice)}
            </p>
          </div>

          {/* Margin */}
          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Margin</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(margin)}
            </p>
            <p className="text-xs text-gray-500">({marginPercent}%)</p>
          </div>

          {/* Unit */}
          <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
              <Package className="h-4 w-4" />
              <span className="text-xs font-medium">Satuan</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{productInfo.unit}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
