"use client";

import { useState, useEffect, useCallback } from "react";
import { useStockHistory } from "@/hooks/useStockHistory";
import { useStockData } from "@/hooks/useStockData";
import ProductSummaryCard from "@/components/owner/stock/ProductSummaryCard";
import HistoryTable from "@/components/owner/stock/HistoryTable";
import StockSkeleton from "@/components/owner/stock/Skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, History, AlertCircle } from "lucide-react";

export default function StockHistoryPage() {
  const [selectedProductGoodsId, setSelectedProductGoodsId] = useState<string>("");

  // Fetch product list from existing hook
  const {
    stockItems,
    outlets,
    selectedOutlet,
    isLoading: isLoadingProducts,
    error: productsError,
    hasBusinessProfile,
    hasOutlet,
    setError: setProductsError,
  } = useStockData();

  // Stock history hook
  const {
    productInfo,
    historyLogs,
    isLoading: isLoadingHistory,
    error: historyError,
    fetchHistory,
    formatCurrency,
    formatDate,
    setError: setHistoryError,
  } = useStockHistory();

  // When product is selected, fetch history
  useEffect(() => {
    if (selectedProductGoodsId) {
      fetchHistory(selectedProductGoodsId);
    }
  }, [selectedProductGoodsId, fetchHistory]);

  // Handle product selection change
  const handleProductChange = useCallback((productGoodsId: string) => {
    setSelectedProductGoodsId(productGoodsId);
  }, []);

  // Get current outlet name
  const currentOutletName = outlets.find((o) => o.id === selectedOutlet)?.name;

  if (isLoadingProducts) return <StockSkeleton />;

  // Guidance screen when business profile/bank or outlets are not ready
  if (!isLoadingProducts && !hasBusinessProfile && !hasOutlet) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 border border-amber-100 dark:border-amber-800/50">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                Lengkapi Profil Bisnis & Tambahkan Outlet
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Untuk melihat history stok, Anda perlu:
              </p>
              <ul className="mt-3 space-y-2 text-gray-700 dark:text-gray-300 list-disc pl-5">
                <li>Lengkapi profil bisnis beserta informasi rekening</li>
                <li>Tambah minimal satu outlet</li>
              </ul>
              <div className="mt-6">
                <Button
                  type="button"
                  onClick={() => (window.location.href = "/owner/dashboard")}
                  className="inline-flex items-center rounded-lg bg-red-600 px-5 py-3 text-white transition-colors hover:bg-red-700">
                  Oke, ke Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <History className="h-7 w-7 text-blue-600" />
            History Stok
          </h1>
          {currentOutletName && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Outlet: <span className="font-medium">{currentOutletName}</span>
            </p>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {(productsError || historyError) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error</h3>
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
              {productsError || historyError}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setProductsError(null);
              setHistoryError(null);
            }}
            className="text-red-400 transition-colors hover:text-red-600 dark:text-red-500 dark:hover:text-red-300">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Button>
        </div>
      )}

      {/* Product Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Package className="h-5 w-5 text-gray-500" />
              <span className="font-medium">Pilih Produk:</span>
            </div>
            <Select value={selectedProductGoodsId} onValueChange={handleProductChange}>
              <SelectTrigger className="w-full sm:w-[350px]">
                <SelectValue placeholder="-- Pilih produk untuk melihat history --" />
              </SelectTrigger>
              <SelectContent>
                {stockItems
                  .filter((item) => item.goods?.id)
                  .map((item) => (
                    <SelectItem key={item.goods!.id} value={item.goods!.id}>
                      {item.name}{" "}
                      {item.goods?.currentStock !== undefined &&
                        `(${item.goods.currentStock} ${item.goods.unit || "pcs"})`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}
      {!selectedProductGoodsId ? (
        // Empty state when no product selected
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Package className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Pilih Produk
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Pilih produk dari dropdown di atas untuk melihat history pergerakan stok, HPP, dan
                informasi lainnya.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Show product info and history when product is selected
        <div className="space-y-6">
          {/* Product Summary Card */}
          {productInfo && (
            <ProductSummaryCard productInfo={productInfo} formatCurrency={formatCurrency} />
          )}

          {/* History Table */}
          <HistoryTable
            logs={historyLogs}
            isLoading={isLoadingHistory}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            unit={productInfo?.unit}
          />
        </div>
      )}
    </div>
  );
}
