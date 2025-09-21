"use client";

interface QueueEmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreateQueue: () => void;
}

export function QueueEmptyState({ hasFilters, onClearFilters, onCreateQueue }: QueueEmptyStateProps) {
  return (
    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow dark:shadow-gray-900/20 border dark:border-gray-700">
      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      
      {hasFilters ? (
        <>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Tidak ada antrian ditemukan
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Tidak ada antrian yang sesuai dengan filter yang dipilih.
          </p>
          <div className="space-x-3">
            <button
              onClick={onClearFilters}
              className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
            >
              Hapus Filter
            </button>
            <button
              onClick={onCreateQueue}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-red-gradient text-white hover:shadow-lg transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Tambah Antrian
            </button>
          </div>
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Belum ada antrian
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Belum ada antrian jasa untuk outlet ini.
          </p>
          <button
            onClick={onCreateQueue}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-red-gradient text-white hover:shadow-lg transition-all duration-300"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Tambah Antrian Pertama
          </button>
        </>
      )}
    </div>
  );
}