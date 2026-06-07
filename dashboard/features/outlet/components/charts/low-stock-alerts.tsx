'use client';

import { AlertCircle, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LowStockProduct {
  id: string;
  name: string;
  currentStock: number;
  reorderLevel: number;
  sku?: string;
}

interface LowStockAlertsProps {
  data: LowStockProduct[];
}

export default function LowStockAlerts({ data }: LowStockAlertsProps) {
  const criticalProducts = data.filter((p) => p.currentStock <= p.reorderLevel * 0.5);
  const warningProducts = data.filter(
    (p) => p.currentStock > p.reorderLevel * 0.5 && p.currentStock <= p.reorderLevel
  );

  const getStockStatus = (current: number, reorder: number) => {
    if (current <= reorder * 0.5) return { label: 'Critical', color: 'bg-red-500/20 text-red-700 dark:text-red-400', icon: '🔴' };
    if (current <= reorder) return { label: 'Warning', color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400', icon: '🟡' };
    return { label: 'Normal', color: 'bg-green-500/20 text-green-700 dark:text-green-400', icon: '🟢' };
  };

  return (
    <div className="rounded-2xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-6 shadow-xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Peringatan Stok
          </h3>
          <div className="text-right">
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Produk</p>
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {data.length}
            </p>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
            <p className="text-xs text-red-700 dark:text-red-400 mb-1">Critical</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              {criticalProducts.length}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
            <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-1">Warning</p>
            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              {warningProducts.length}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
            <p className="text-xs text-green-700 dark:text-green-400 mb-1">Normal</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {data.length - criticalProducts.length - warningProducts.length}
            </p>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Semua produk stok terpenuhi
            </p>
          </div>
        ) : (
          data.map((product) => {
            const status = getStockStatus(product.currentStock, product.reorderLevel);
            const stockPercentage = (product.currentStock / product.reorderLevel) * 100;

            return (
              <div
                key={product.id}
                className="p-4 rounded-lg bg-white/5 dark:bg-gray-700/20 border border-white/10 dark:border-gray-700/30 hover:bg-white/10 dark:hover:bg-gray-700/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {product.name}
                      </h4>
                      <Badge className={`text-xs ${status.color}`}>
                        {status.label}
                      </Badge>
                    </div>
                    {product.sku && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        SKU: {product.sku}
                      </p>
                    )}
                  </div>
                  <span className="text-2xl">{status.icon}</span>
                </div>

                {/* Stock Info */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {product.currentStock} / {product.reorderLevel}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {stockPercentage.toFixed(0)}%
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all rounded-full ${
                      stockPercentage <= 50
                        ? 'bg-red-500'
                        : stockPercentage <= 100
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                  />
                </div>

                {/* Alert Message */}
                {stockPercentage <= 50 && (
                  <div className="mt-3 flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-700 dark:text-red-400">
                      Segera pesan ulang sebelum stok habis
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
