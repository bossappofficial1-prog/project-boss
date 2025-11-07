"use client";

import { Button } from '@/components/ui/button';
import type { QueuePrimaryAction } from '@/hooks/useQueueActions';
import { type QueueEntry, type OrderStatus } from '@/lib/apis/order';
import { ListOrdered } from 'lucide-react';

interface QueueMobileCardsProps {
  queue: QueueEntry[];
  pendingQueueId: string | null;
  onStatusChange: (entry: QueueEntry, nextStatus: OrderStatus) => void;
  onPrimaryAction: (entry: QueueEntry) => void;
  getPrimaryAction: (entry: QueueEntry) => QueuePrimaryAction | null;
}

const statusMap: Record<string, { label: string; value: OrderStatus }> = {
  AWAITING_PAYMENT: { label: 'Menunggu Bayar', value: 'AWAITING_PAYMENT' },
  CONFIRMED: { label: 'Dikonfirmasi', value: 'CONFIRMED' },
  PROCESSING: { label: 'Menunggu', value: 'PROCESSING' },
  READY: { label: 'Siap', value: 'READY' },
  ON_GOING: { label: 'Sedang Dilayani', value: 'ON_GOING' },
  COMPLETED: { label: 'Selesai', value: 'COMPLETED' },
  CANCELLED: { label: 'Dibatalkan', value: 'CANCELLED' },
};

const transitionMap: Record<string, OrderStatus[]> = {
  AWAITING_PAYMENT: ['PROCESSING', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY', 'CANCELLED'],
  READY: ['ON_GOING', 'COMPLETED', 'CANCELLED'],
  ON_GOING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
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
  const raw = item.scheduledStart ?? item.queueMeta?.scheduledStart ?? item.bookingSlot?.startTime ?? item.bookingDate;
  return raw ? formatDate(raw) : '-';
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function QueueMobileCards({ queue, pendingQueueId, onStatusChange, onPrimaryAction, getPrimaryAction }: QueueMobileCardsProps) {
  const getQueuePosition = (item: QueueEntry) => item.queueMeta?.position ?? item.position ?? item.queueNumber ?? 0;

  const getStatusOptions = (currentStatus: string) => {
    const currentStatusOptions = statusMap[currentStatus];
    if (!currentStatusOptions) {
      return [] as Array<{ label: string; value: OrderStatus }>;
    }

    const transitions = transitionMap[currentStatus] ?? [];
    const options = [currentStatusOptions];

    transitions.forEach((status) => {
      const mapped = statusMap[status];
      if (mapped) {
        options.push(mapped);
      }
    });

    return options;
  };

  const handleStatusChange = (entry: QueueEntry, newStatus: string) => {
    if (entry.status === newStatus) return;
    onStatusChange(entry, newStatus as OrderStatus);
  };

  return (
    <div className="space-y-3">
      {queue.map((item) => {
        const queuePosition = getQueuePosition(item);
        const primaryAction = getPrimaryAction(item);

        return (
          <div
            key={item.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/20 p-4 border dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    {queuePosition || '-'}
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
                onChange={(e) => handleStatusChange(item, e.target.value)}
                disabled={pendingQueueId === item.id}
                className="text-xs font-medium rounded-full px-2.5 py-0.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 cursor-pointer disabled:opacity-50"
              >
                {getStatusOptions(item.status).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 mt-3">
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

            {primaryAction && (
              <Button
                size="sm"
                variant="secondary"
                className="mt-3 w-full"
                onClick={() => onPrimaryAction(item)}
                disabled={pendingQueueId === item.id}
              >
                {primaryAction.label}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
