"use client";

import React from 'react';
import { resolveUploadImageUrl } from '@/lib/url';

export interface ProductItem {
  id: string;
  name: string;
  description?: string;
  costPrice: number;
  price: number;
  type: 'GOODS' | 'SERVICE';
  quantity?: number;
  unit?: string;
  status: 'ACTIVE' | 'INACTIVE';
  serviceDurationMinutes?: number;
  image?: string;
}

export interface MobileCardsProps {
  products: ProductItem[];
  onEdit: (p: ProductItem) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (p: ProductItem) => void;
  formatCurrency: (n: number) => string;
  formatDuration: (n?: number) => string;
}

export default function MobileCards({ products, onEdit, onDelete, onToggleStatus, formatCurrency, formatDuration }: MobileCardsProps) {
  return (
    <div className="sm:hidden space-y-3">
      {products.map((product) => (
        <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/20 p-4 flex gap-3 border dark:border-gray-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveUploadImageUrl(product.image) || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
            alt={product.name}
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{product.name}</div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${product.type === 'GOODS' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                {product.type === 'GOODS' ? 'Barang' : 'Jasa'}
              </span>
            </div>
            {product.description && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{product.description}</div>
            )}
            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <div className="font-medium">{formatCurrency(product.price)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Modal: {formatCurrency(product.costPrice)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onEdit(product)} className="text-indigo-600 hover:text-indigo-900 p-1" title="Edit">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => onDelete(product.id)} className="text-red-600 hover:text-red-900 p-1" title="Hapus">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button onClick={() => onToggleStatus(product)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${product.status === 'ACTIVE' ? 'bg-red-600' : 'bg-gray-200'}`} title="Aktif/Non-aktif">
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${product.status === 'ACTIVE' ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
