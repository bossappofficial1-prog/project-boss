"use client";

import { useState } from 'react';
import { orderApi, type QueueEntry, type OrderStatus } from '@/lib/apis/order';
import { ListOrdered } from 'lucide-react';

interface QueueMobileCardsProps {
  queue: QueueEntry[];
  onRefresh: () => void;
}

export function QueueMobileCards({ queue, onRefresh }: QueueMobileCardsProps) {
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const getQueuePosition = (item: QueueEntry) => item.queueMeta?.position ?? item.position ?? item.queueNumber ?? 0;

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

  const formatSchedule = (item: QueueEntry) => {
    const raw = item.scheduledStart
      ?? item.queueMeta?.scheduledStart
      ?? item.bookingSlot?.startTime
      ?? item.bookingDate;
    return raw ? formatDate(raw) : '-';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-3">
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
                  {getQueuePosition(item) || '-'}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {item.customerName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {item.guestCustomer?.phone}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <ListOrdered className="w-3 h-3" />
                  <span>
                    {item.queueMeta?.totalAhead && item.queueMeta.totalAhead > 0
                      ? `${item.queueMeta.totalAhead} antrean di depan`
                      : 'Giliran berikutnya'}
                  </span>
                </div>
              </div>
            </div>
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
                  {formatSchedule(item)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}