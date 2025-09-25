"use client";

import { useState } from 'react';
import { orderApi, type QueueEntry, type OrderStatus } from '@/lib/apis/order';

interface QueueDesktopTableProps {
  queue: QueueEntry[];
  onRefresh: () => void;
}

export function QueueDesktopTable({ queue, onRefresh }: QueueDesktopTableProps) {
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const getStatusOptions = (currentStatus: string) => {
    const statusMap = {
      'AWAITING_PAYMENT': { label: 'Menunggu Bayar', value: 'AWAITING_PAYMENT' },
      'CONFIRMED': { label: 'Dikonfirmasi', value: 'CONFIRMED' },
      'PROCESSING': { label: 'Menunggu', value: 'PROCESSING' },
      'READY': { label: 'Siap', value: 'READY' },
      'COMPLETED': { label: 'Selesai', value: 'COMPLETED' },
      'CANCELLED': { label: 'Dibatalkan', value: 'CANCELLED' },
    };

    const currentStatusObj = statusMap[currentStatus as keyof typeof statusMap];
    if (!currentStatusObj) return [];

    // Define valid transitions for queue items
    const transitions = {
      'AWAITING_PAYMENT': ['PROCESSING', 'CANCELLED'],
      'CONFIRMED': ['PROCESSING', 'CANCELLED'],
      'PROCESSING': ['READY', 'CANCELLED'],
      'READY': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [],
      'CANCELLED': [],
    };

    const availableTransitions = transitions[currentStatus as keyof typeof transitions] || [];
    const options = [currentStatusObj];

    availableTransitions.forEach(status => {
      if (statusMap[status as keyof typeof statusMap]) {
        options.push(statusMap[status as keyof typeof statusMap]);
      }
    });

    return options;
  };

  const handleStatusChange = async (queueId: string, currentStatus: string, newStatus: string) => {
    if (currentStatus === newStatus) return;

    const statusLabels = {
      'AWAITING_PAYMENT': 'Menunggu Bayar',
      'CONFIRMED': 'Dikonfirmasi', 
      'PROCESSING': 'Menunggu',
      'READY': 'Siap',
      'COMPLETED': 'Selesai',
      'CANCELLED': 'Dibatalkan',
    };

    const currentLabel = statusLabels[currentStatus as keyof typeof statusLabels] || currentStatus;
    const newLabel = statusLabels[newStatus as keyof typeof statusLabels] || newStatus;

    const confirmMessage = `Ubah status antrian dari "${currentLabel}" ke "${newLabel}"?`;
    if (!window.confirm(confirmMessage)) return;

    setUpdatingStatus(queueId);
    try {
      await orderApi.updateStatus(queueId, newStatus as OrderStatus);
      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Gagal mengubah status. Silakan coba lagi.');
    } finally {
      setUpdatingStatus(null);
    }
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
    <div className="hidden sm:block overflow-x-auto rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">No</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">No. Antrian</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Layanan</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Waktu Booking</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {queue.map((item, idx) => (
            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-3">
                <div className="text-sm text-gray-900 dark:text-gray-100">{idx + 1}</div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {item.queueNumber || item.position || '-'}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.customerName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {item.guestCustomer?.phone}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.productName}
                  </div>
                  {item.items && item.items.length > 1 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      +{item.items.length - 1} item lainnya
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(item.totalAmount)}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {item.bookingDate
                    ? formatDate(item.bookingDate)
                    : (item as any).bookingSlot?.startTime
                      ? formatDate((item as any).bookingSlot.startTime as unknown as string)
                      : '-'}
                </div>
              </td>
              <td className="px-4 py-3">
                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(item.id, item.status, e.target.value)}
                  disabled={updatingStatus === item.id}
                  className="text-xs font-medium rounded-full px-2.5 py-0.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 cursor-pointer disabled:opacity-50"
                >
                  {getStatusOptions(item.status).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}