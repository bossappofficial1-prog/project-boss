"use client";
import React from 'react';

type Props = {
  outletName?: string;
  onExport: () => void;
};

export default function StockHeader({ outletName, onExport }: Props) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Stok Produk</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor dan kelola stok untuk outlet {outletName || '-'}
        </p>
      </div>
      <div className="mt-4 lg:mt-0">
        <button
          onClick={onExport}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Data
        </button>
      </div>
    </div>
  );
}
