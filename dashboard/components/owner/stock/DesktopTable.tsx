"use client";
import React from 'react';
import { resolveUploadImageUrl } from '@/lib/url';

type Item = {
  id: string;
  name: string;
  image?: string;
  quantity?: number;
  unit?: string;
  price: number;
  status: 'ACTIVE' | 'INACTIVE';
};

type Props = {
  items: Item[];
  onUpdateStock: (item: Item) => void;
  formatCurrency: (n: number) => string;
  getStockStatus: (q?: number) => string;
  getStockStatusColor: (q?: number) => string;
};

export default function StockDesktopTable({ items, onUpdateStock, formatCurrency, getStockStatus, getStockStatusColor }: Props) {
  return (
    <div className="hidden sm:block overflow-x-auto rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">No</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Produk</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stok</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Satuan</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Harga Jual</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {items.map((item, index) => (
            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-3">
                <div className="text-sm text-gray-900 dark:text-gray-100">{index + 1}</div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <img
                    className="w-12 h-12 rounded-lg object-cover"
                    src={resolveUploadImageUrl(item.image) || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
                    alt={item.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png';
                    }}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900 dark:text-gray-100">{item.quantity || 0}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(item.quantity)}`}>
                    {getStockStatus(item.quantity)}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-gray-900 dark:text-gray-100">{item.unit || 'pcs'}</div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-gray-900 dark:text-gray-100">{formatCurrency(item.price)}</div>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {item.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={() => onUpdateStock(item)} 
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900 px-2 py-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20" 
                    title="Update Stok"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Update Stok
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
