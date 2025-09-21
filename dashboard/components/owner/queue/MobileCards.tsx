"use client";

import { useState } from 'react';
import { orderApi, type QueueEntry, type OrderStatus } from '@/lib/apis/order';

interface QueueMobileCardsProps {
  queue: QueueEntry[];
  onRefresh: () => void;
}

export function QueueMobileCards({ queue, onRefresh }: QueueMobileCardsProps) {
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleStatusUpdate = async (queueId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(queueId);
    try {
      await orderApi.updateStatus(queueId, newStatus);
      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PROCESSING': { label: 'Menunggu', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      'READY': { label: 'Siap', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      'COMPLETED': { label: 'Selesai', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      'CANCELLED': { label: 'Dibatalkan', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
      'AWAITING_PAYMENT': { label: 'Menunggu Bayar', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' },
      'CONFIRMED': { label: 'Dikonfirmasi', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="sm:hidden space-y-3">
      {queue.map((item) => (
        <div
          key={item.id}
          className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/20 p-4 border dark:border-gray-700"
        >
          {/* Header with queue number and status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  {item.queueNumber || item.position || '-'}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {item.customerName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {item.guestCustomer?.phone}
                </p>
              </div>
            </div>
            {getStatusBadge(item.status)}
          </div>

          {/* Service details */}
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Layanan:</span>
              <p className="text-gray-900 dark:text-gray-100 mt-1">
                {item.productName}
                {item.items && item.items.length > 1 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    +{item.items.length - 1} item lainnya
                  </span>
                )}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total:</span>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(item.totalAmount)}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Booking:</span>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {item.bookingDate ? formatDate(item.bookingDate) : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {item.status === 'PROCESSING' && (
              <button
                onClick={() => handleStatusUpdate(item.id, 'READY')}
                disabled={updatingStatus === item.id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 transition-colors"
              >
                {updatingStatus === item.id ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="text-sm font-medium">Tandai Siap</span>
              </button>
            )}
            
            {item.status === 'READY' && (
              <button
                onClick={() => handleStatusUpdate(item.id, 'COMPLETED')}
                disabled={updatingStatus === item.id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 disabled:opacity-50 transition-colors"
              >
                {updatingStatus === item.id ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span className="text-sm font-medium">Selesaikan</span>
              </button>
            )}

            {(item.status === 'COMPLETED' || item.status === 'CANCELLED') && (
              <div className="flex-1 text-center py-2 text-sm text-gray-500 dark:text-gray-400">
                {item.status === 'COMPLETED' ? 'Antrian telah selesai' : 'Antrian dibatalkan'}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}