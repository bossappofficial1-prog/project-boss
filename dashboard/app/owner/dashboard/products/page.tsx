'use client';

import { useState } from 'react';
import AddProductServiceModal from '@/components/modals/AddProductServiceModal';
import ImportDataModal from '@/components/modals/ImportDataModal';
import EditProductServiceModal from '@/components/modals/EditProductServiceModal';
import ProductsHeader from '@/components/owner/products/Header';
import ProductsControls from '@/components/owner/products/Controls';
import ProductsSkeleton from '@/components/owner/products/Skeleton';
import ProductsEmptyState from '@/components/owner/products/EmptyState';
import MobileCards from '@/components/owner/products/MobileCards';
import DesktopTable from '@/components/owner/products/DesktopTable';
import { useProductsData } from '@/hooks/useProductsData';

export default function ProductsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const {
    products,
    outlets,
    selectedOutlet,
    currentPage,
    itemsPerPage,
    totalPages,
    totalProducts,
    searchQuery,
    isLoading,
    error,
    hasBusinessProfile,
    hasOutlet,
    setCurrentPage,
    setItemsPerPage,
    setError,
    handleSearch,
    handleDeleteProduct,
    handleToggleStatus,
    handleExportProducts,
    handleRefreshData,
    formatCurrency,
    formatDuration,
  } = useProductsData();

  if (isLoading && products.length === 0) {
    return <ProductsSkeleton />;
  }

  // Guidance screen when BOTH business profile and outlets are missing
  if (!isLoading && !hasBusinessProfile && !hasOutlet) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 border border-amber-100 dark:border-amber-800/50">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10A8 8 0 11.001 10 8 8 0 0118 10zm-8-4a1 1 0 00-.993.883L9 7v3a1 1 0 00.883.993L10 11h.01a1 1 0 01.117 1.993L10 13H9a1 1 0 00-.117 1.993L9 15h2a1 1 0 00.117-1.993L11 13h-.01a1 1 0 01-.117-1.993L11 11h-1V7a1 1 0 00-1-1zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Lengkapi Profil Bisnis & Tambahkan Outlet</h2>
              <p className="text-gray-600 mt-1">Untuk mulai menambah Produk dan Jasa, Anda perlu:</p>
              <ul className="mt-3 space-y-2 text-gray-700 list-disc pl-5">
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
    )
  }

  return (
    <>
      <div className="space-y-8">
        <ProductsHeader outletName={outlets.find(o => o.id === selectedOutlet)?.name} />

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

        <ProductsControls
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          onRefresh={handleRefreshData}
          onAdd={() => setShowAddModal(true)}
          onImport={() => setShowImportModal(true)}
          onExport={handleExportProducts}
          hasOutlet={hasOutlet}
        />

        {/* No inline callout; full-page guidance covers the not-ready case when both missing */}

        {/* Action buttons moved into ProductsControls */}

        <MobileCards
          products={products as any}
          onEdit={(p) => { setSelectedProduct(p); setShowEditModal(true); }}
          onDelete={(id) => handleDeleteProduct(id)}
          onToggleStatus={(p) => handleToggleStatus(p as any)}
          formatCurrency={formatCurrency}
          formatDuration={formatDuration}
        />
        {products.length === 0 && !isLoading && (
          <ProductsEmptyState hasOutlet={hasOutlet} onAdd={() => setShowAddModal(true)} />
        )}

        <DesktopTable
          products={products as any}
          onEdit={(p) => { setSelectedProduct(p); setShowEditModal(true); }}
          onDelete={(id) => handleDeleteProduct(id)}
          onToggleStatus={(p) => handleToggleStatus(p as any)}
          formatCurrency={formatCurrency}
          formatDuration={formatDuration}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Menampilkan{' '}
                  <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{' '}
                  sampai{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalProducts)}
                  </span>{' '}
                  dari{' '}
                  <span className="font-medium">{totalProducts}</span> produk
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + Math.max(1, currentPage - 2);
                    if (pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                            ? 'z-10 bg-red-50 border-red-500 text-red-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Modals */}
      <AddProductServiceModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        outletId={selectedOutlet || null}
        onSuccess={() => { /* refresh */ handleRefreshData(); }}
      />
      <EditProductServiceModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        item={selectedProduct as any}
        onSuccess={() => { setSelectedProduct(null); handleRefreshData(); }}
      />
      <ImportDataModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        outletId={selectedOutlet || null}
        onImported={handleRefreshData}
      />
    </>
  );
}
