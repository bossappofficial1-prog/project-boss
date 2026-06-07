"use client";

import { useState } from 'react';
import EditProductServiceModal from '@/components/modals/edit-product-service-modal';
import { useServicesData } from '@/hooks/use-services-data';
import ServicesHeader from '@/features/owner/services/header';
import ServicesControls from '@/features/owner/services/controls';
import ServicesMobileCards from '@/features/owner/services/mobile-cards';
import ServicesDesktopTable from '@/features/owner/services/desktop-table';
import ServicesSkeleton from '@/features/owner/services/skeleton';
import ServicesEmptyState from '@/features/owner/services/empty-state';

export default function ServicesPage() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedService, setSelectedService] = useState<any | null>(null);

  const {
    services,
    outlets,
    selectedOutlet,
    searchQuery,
    statusFilter,
    currentPage,
    itemsPerPage,
    totalServices,
    isLoading,
    isFetching,
    error,
    hasBusinessProfile,
    hasOutlet,
    setSearchQuery,
    setStatusFilter,
    setError,
    fetchServices,
    handlePaginationChange,
    handleSearchClick,
    handleExportServices,
    formatCurrency,
    formatDuration,
  } = useServicesData();

  if (isLoading) {
    return (
      <>
        <ServicesSkeleton />
      </>
    );
  }

  // Guidance screen when BOTH business profile and outlet are missing
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
                <p className="text-gray-600 dark:text-gray-400 mt-1">Untuk mulai menambah Produk dan Jasa, Anda perlu:</p>
                <ul className="mt-3 space-y-2 text-gray-700 dark:text-gray-300 list-disc pl-5">
                  <li>Lengkapi profil bisnis beserta informasi rekening</li>
                  <li>Tambah minimal satu outlet</li>
                </ul>
                <div className="mt-6">
                  <button
                    onClick={() => (window.location.href = '/owner')}
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
        <ServicesHeader outletName={outlets.find(o => o.id === selectedOutlet)?.name} onExport={handleExportServices} />

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

        {/* No inline callout; full-page guidance covers the not-ready (both missing) case */}

        <ServicesControls
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClick={handleSearchClick}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        {services.length === 0 && !isLoading ? (
          <ServicesEmptyState />
        ) : (
          <>
            {/* Desktop Table */}
            <ServicesDesktopTable
              services={services as any}
              onEdit={(s) => { setSelectedService(s); setShowEditModal(true); }}
              onRefresh={fetchServices}
              formatCurrency={formatCurrency}
              formatDuration={formatDuration}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalServices={totalServices}
              onPaginationChange={handlePaginationChange}
              isFetching={isFetching}
            />

            {/* Mobile Cards */}
            <ServicesMobileCards
              services={services as any}
              onEdit={(s) => { setSelectedService(s); setShowEditModal(true); }}
              formatCurrency={formatCurrency}
              formatDuration={formatDuration}
            />
          </>
        )}
      </div>
      <EditProductServiceModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        item={selectedService as any}
        onSuccess={() => { setShowEditModal(false); fetchServices(); }}
      />
    </>
  );
}
