'use client';

import { useState } from 'react';
import ImportDataModal from '@/components/modals/ImportDataModal';
import ProductsHeader from '@/components/owner/products/Header';
import ProductsControls from '@/components/owner/products/Controls';
import ProductsSkeleton from '@/components/owner/products/Skeleton';
import DesktopTable from '@/components/owner/products/DesktopTable';
import { ProductItem, useProductsData } from '@/hooks/useProductsData';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { toast } from 'sonner';
import AddOrEditProductServiceModal from '@/components/modals/AddProductServiceModal';

export default function ProductsPage() {
  const [showAddOrEditModal, setShowAddOrEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState(false)
  const [action, setAction] = useState<'add' | 'edit'>('add')

  const {
    products,
    outlets,
    selectedOutlet,
    currentPage,
    itemsPerPage,
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
    formatDuration,
  } = useProductsData();

  const handleDelete = async (productId: string) => {
    try {
      setActionLoading(true)
      await handleDeleteProduct(productId)
      setShowDeleteModal(false)
      toast.success(`Berhasil mengapus produk`)
    } catch (error) {
      toast.error((error as any).message || `Gagal menghapus produk`)
    } finally { setActionLoading(false) }
  }

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
          onAdd={() => { setShowAddOrEditModal(true); setAction('add') }}
          onImport={() => setShowImportModal(true)}
          onExport={handleExportProducts}
          hasOutlet={hasOutlet}
        />

        {/* {products.length === 0 && !isLoading && (
          <ProductsEmptyState hasOutlet={hasOutlet} onAdd={() => setShowAddOrEditModal(true)} />
        )} */}

        <DesktopTable
          products={products as any}
          onEdit={(p) => { setSelectedProduct(p); setAction('edit'); setShowAddOrEditModal(true) }}
          onDelete={(product) => { setShowDeleteModal(true); setSelectedProduct(product) }}
          onToggleStatus={(p) => handleToggleStatus(p as any)}
          formatDuration={formatDuration}
          onRefresh={handleRefreshData}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalProducts={totalProducts}
          isFetching={isLoading}
          onPaginationChange={({ page, limit }) => {
            setItemsPerPage(limit);
            setCurrentPage(page);
          }}
          searchValue={searchQuery}
          onSearchChange={handleSearch}
          searchPlaceholder="Cari produk..."
          serverSideSearch
          searchDebounceMs={300}
        />

      </div>
      {/* Modals */}
      <AddOrEditProductServiceModal
        action={action}
        open={showAddOrEditModal}
        onOpenChange={setShowAddOrEditModal}
        outletId={selectedOutlet || null}
        data={selectedProduct}
        initialData={{
          ...selectedProduct
        }}
        onSuccess={() => { handleRefreshData(); action == 'edit' && setSelectedProduct(null); }}
      />

      <ImportDataModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        outletId={selectedOutlet || null}
        onImported={handleRefreshData}
      />

      {showDeleteModal && selectedProduct &&
        <ConfirmationModal
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
          description={`Yakin ingin mengapus product '${selectedProduct.name}' ini?, tindakan tidak dapat dibatalkan`}
          title="Konfirmasi Hapus"
          onConfirm={() => handleDelete(selectedProduct.id)}
          confirmVariant='destructive'
          loading={actionLoading}
        />
      }
    </>
  );
}