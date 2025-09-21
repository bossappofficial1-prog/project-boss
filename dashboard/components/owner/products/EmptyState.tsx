"use client";

interface EmptyStateProps {
  hasOutlet: boolean;
  onAdd: () => void;
}

export default function ProductsEmptyState({ hasOutlet, onAdd }: EmptyStateProps) {
  return (
    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow dark:shadow-gray-900/20 border dark:border-gray-700">
      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Tidak ada produk</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">Belum ada produk untuk outlet ini.</p>
      <button
        onClick={() => hasOutlet && onAdd()}
        disabled={!hasOutlet}
        className={`inline-flex items-center px-4 py-2 rounded-lg transition-all duration-300 ${hasOutlet ? 'bg-red-gradient text-white hover:shadow-lg' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Tambah Produk Pertama
      </button>
    </div>
  );
}
