"use client";

interface OrdersEmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreateOrder: () => void;
}

export function OrdersEmptyState({ hasFilters, onClearFilters, onCreateOrder }: OrdersEmptyStateProps) {
  return (
    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow dark:shadow-gray-900/20 border dark:border-gray-700">
      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
      
      {hasFilters ? (
        <>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Tidak ada pesanan ditemukan
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Tidak ada pesanan yang sesuai dengan filter yang dipilih.
          </p>
          <div className="space-x-3">
            <button
              onClick={onClearFilters}
              className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
            >
              Hapus Filter
            </button>
            <button
              onClick={onCreateOrder}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-red-gradient text-white hover:shadow-lg transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Tambah Pesanan
            </button>
          </div>
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Belum ada pesanan
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Belum ada pesanan barang untuk outlet ini.
          </p>
          <button
            onClick={onCreateOrder}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-red-gradient text-white hover:shadow-lg transition-all duration-300"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Tambah Pesanan Pertama
          </button>
        </>
      )}
    </div>
  );
}