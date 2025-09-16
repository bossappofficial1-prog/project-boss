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

export interface DesktopTableProps {
  products: ProductItem[];
  onEdit: (p: ProductItem) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (p: ProductItem) => void;
  formatCurrency: (n: number) => string;
  formatDuration: (n?: number) => string;
}

export default function DesktopTable({ products, onEdit, onDelete, onToggleStatus, formatCurrency, formatDuration }: DesktopTableProps) {
  return (
    <div className="hidden sm:block overflow-x-auto rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Produk</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Harga</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jenis</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stok/Durasi</th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveUploadImageUrl(product.image) || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'
                    }}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{product.description}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="text-gray-900 dark:text-gray-100">{formatCurrency(product.price)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Modal: {formatCurrency(product.costPrice)}</div>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.type === 'GOODS' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                  {product.type === 'GOODS' ? 'Barang' : 'Jasa'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {product.type === 'GOODS' ? (
                  <div>
                    <div>Stok: {product.quantity ?? 0} {product.unit || ''}</div>
                  </div>
                ) : (
                  <div>Durasi: {formatDuration(product.serviceDurationMinutes)}</div>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => onEdit(product)} className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900 px-2 py-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20" title="Edit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button onClick={() => onDelete(product.id)} className="inline-flex items-center gap-1 text-red-600 hover:text-red-900 px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20" title="Hapus">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Hapus
                  </button>
                  <button onClick={() => onToggleStatus(product)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${product.status === 'ACTIVE' ? 'bg-red-600' : 'bg-gray-200'}`} title="Aktif/Non-aktif">
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${product.status === 'ACTIVE' ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
