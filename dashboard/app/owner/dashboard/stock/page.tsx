"use client";

import { useState } from 'react';
import UpdateStockModal from '@/components/modals/UpdateStockModal';
import { useStockData } from '@/hooks/useStockData';
import StockHeader from '@/components/owner/stock/Header';
import StockControls from '@/components/owner/stock/Controls';
import StockMobileCards from '@/components/owner/stock/MobileCards';
import StockDesktopTable from '@/components/owner/stock/DesktopTable';
import StockSkeleton from '@/components/owner/stock/Skeleton';
import StockEmptyState from '@/components/owner/stock/EmptyState';

export default function StockPage() {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const {
    stockItems,
    outlets,
    selectedOutlet,
    searchQuery,
    statusFilter,
    isLoading,
    error,
    hasBusinessProfile,
    hasOutlet,
    setSearchQuery,
    setStatusFilter,
    setError,
    fetchStock,
    handleSearchClick,
    handleExport,
    formatCurrency,
    getStockStatus,
    getStockStatusColor,
  } = useStockData();

  if (isLoading) return <StockSkeleton />

  // Guidance screen when business profile/bank or outlets are not ready
  if (!isLoading && !hasBusinessProfile && !hasOutlet) {
    return (
      <>
        <div className="max-w-3xl mx-auto mt-10">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 border border-amber-100 dark:border-amber-800/50">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10A8 8 0 11.001 10 8 8 0 0118 10zm-8-4a1 1 0 00-.993.883L9 7v3a1 1 0 00.883.993L10 11h.01a1 1 0 01.117 1.993L10 13H9a1 1 0 00-.117 1.993L9 15h2a1 1 0 00.117-1.993L11 13h-.01a1 1 0 01-.117-1.993L11 11h-1V7a1 1 0 00-1-1zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Lengkapi Profil Bisnis & Tambahkan Outlet</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Untuk mengelola stok produk, Anda perlu:</p>
                <ul className="mt-3 space-y-2 text-gray-700 dark:text-gray-300 list-disc pl-5">
                  <li>Lengkapi profil bisnis beserta informasi rekening</li>
                  <li>Tambah minimal satu outlet</li>
                </ul>
                <div className="mt-6">
                  <button
                    onClick={() => (window.location.href = '/owner/dashboard')}
                    className="inline-flex items-center px-5 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    Oke, ke Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="space-y-8">
        <StockHeader outletName={outlets.find(o => o.id === selectedOutlet)?.name} onExport={handleExport} />

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error</h3>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        <StockControls
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClick={handleSearchClick}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter as any}
        />

        <StockMobileCards
          items={stockItems as any}
          onUpdateStock={(item) => { setSelectedProduct(item); setShowUpdateModal(true); }}
          formatCurrency={formatCurrency}
          getStockStatus={getStockStatus}
          getStockStatusColor={getStockStatusColor}
        />
        {stockItems.length === 0 && !isLoading && <StockEmptyState />}

        <StockDesktopTable
          items={stockItems as any}
          onUpdateStock={(item) => { setSelectedProduct(item); setShowUpdateModal(true); }}
          formatCurrency={formatCurrency}
          getStockStatus={getStockStatus}
          getStockStatusColor={getStockStatusColor}
        />
        {stockItems.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data stok</h3>
            <p className="text-gray-500">Belum ada produk yang ditemukan sesuai filter yang dipilih.</p>
          </div>
        )}
      </div>

      {/* Update Stock Modal */}
      <UpdateStockModal
        open={showUpdateModal}
        onOpenChange={setShowUpdateModal}
        product={selectedProduct}
        onUpdated={fetchStock}
      />
    </>
  );
}
