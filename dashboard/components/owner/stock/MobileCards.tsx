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

export default function StockMobileCards({ items, onUpdateStock, formatCurrency, getStockStatus, getStockStatusColor }: Props) {
  if (items.length === 0) return null;
  return (
    <div className="sm:hidden space-y-3">
      {items.map((item) => (
        <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/20 p-4 flex gap-3 border dark:border-gray-700">
          <img
            src={resolveUploadImageUrl(item.image) || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
            alt={item.name}
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png';
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{item.name}</div>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="text-gray-600 dark:text-gray-400">{formatCurrency(item.price)}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${getStockStatusColor(item.quantity)}`}>{getStockStatus(item.quantity)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
              <div>Stok: {item.quantity || 0} {item.unit || 'pcs'}</div>
              <button
                onClick={() => onUpdateStock(item)}
                className="text-indigo-600 hover:text-indigo-900"
              >
                Update Stok
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
