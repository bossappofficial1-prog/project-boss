"use client";

export default function ServicesEmptyState() {
  return (
    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow dark:shadow-gray-900/20 border dark:border-gray-700">
      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Tidak ada jasa</h3>
      <p className="text-gray-500 dark:text-gray-400">Belum ada jasa untuk outlet ini.</p>
    </div>
  );
}
