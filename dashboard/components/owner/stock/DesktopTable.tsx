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
    <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border dark:border-gray-700">
      <div className="overflow-x-auto max-w-full">
        <div className="min-w-full inline-block align-middle">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
              <tr>
                <th className="w-14 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">No</th>
                <th className="w-24 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Gambar</th>
                <th className="w-56 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama Produk</th>
                <th className="w-20 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stok</th>
                <th className="w-20 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Satuan</th>
                <th className="w-28 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Harga Jual</th>
                <th className="w-28 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="w-28 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{index + 1}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <div className="flex-shrink-0 h-12 w-12">
                      <img
                        className="h-12 w-12 rounded-lg object-cover"
                        src={resolveUploadImageUrl(item.image) || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
                        alt={item.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png';
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <div className="flex items-center sm:block">
                      <div className="flex-shrink-0 h-10 w-10 mr-3 sm:hidden">
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={resolveUploadImageUrl(item.image) || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
                          alt={item.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{item.name}</div>
                        <div className="mt-1 sm:hidden flex flex-wrap gap-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 md:hidden">{formatCurrency(item.price)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="text-sm text-gray-900 dark:text-gray-100 sm:mr-2">{item.quantity || 0}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 sm:mt-0 ${getStockStatusColor(item.quantity)}`}>{getStockStatus(item.quantity)}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 lg:hidden">{item.unit || 'pcs'}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 hidden lg:table-cell">{item.unit || 'pcs'}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 hidden md:table-cell">{formatCurrency(item.price)}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}</span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => onUpdateStock(item)} className="text-indigo-600 hover:text-indigo-900 flex items-center text-xs sm:text-sm">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="hidden sm:inline">Update Stok</span>
                      <span className="sm:hidden">Update</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
