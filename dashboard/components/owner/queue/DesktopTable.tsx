"use client";

import { Button } from '@/components/ui/button';
import type { QueuePrimaryAction } from '@/hooks/useQueueActions';
import { type QueueEntry, type OrderStatus } from '@/lib/apis/order';

interface QueueDesktopTableProps {
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
  const scheduled = item.scheduledStart ?? item.queueMeta?.scheduledStart ?? item.bookingSlot?.startTime ?? item.bookingDate;
  return scheduled ? formatDate(scheduled) : '-';
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const resolveStaffName = (item: QueueEntry) => {
  return item.assignedStaff?.name ?? item.bookingSlot?.staff?.name ?? null;
};

export function QueueDesktopTable({ queue, pendingQueueId, onStatusChange, onPrimaryAction, getPrimaryAction }: QueueDesktopTableProps) {
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
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Staff</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {queue.map((item, idx) => {
            const queuePosition = getQueuePosition(item);
            const primaryAction = getPrimaryAction(item);

            return (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900 dark:text-gray-100">{idx + 1}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                        {queuePosition || '-'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.queueMeta?.totalAhead && item.queueMeta.totalAhead > 0
                        ? `${item.queueMeta.totalAhead} antrean di depan`
                        : 'Giliran berikutnya'}
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
                    {formatSchedule(item)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {resolveStaffName(item) ?? '-'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
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

                    {primaryAction && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs font-medium"
                        onClick={() => onPrimaryAction(item)}
                        disabled={pendingQueueId === item.id}
                      >
                        {primaryAction.label}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}