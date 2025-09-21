'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { QueueHeader } from '@/components/owner/queue/Header';
import { QueueDesktopTable } from '@/components/owner/queue/DesktopTable';
import { QueueMobileCards } from '@/components/owner/queue/MobileCards';
import { QueueEmptyState } from '@/components/owner/queue/EmptyState';
import { useOutletQueue } from '@/hooks/useOrders';
import { useSelectedOutletId } from '@/hooks/useOutlet';

export default function QueuePage() {
  const { outletId, loading: outletLoading } = useSelectedOutletId();
  const { data, loading, error } = useOutletQueue(outletId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <QueueHeader />

        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        {outletLoading || loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
            </div>
          </div>
        ) : !outletId ? (
          <div className="text-sm text-gray-600">Pilih outlet terlebih dahulu.</div>
        ) : !data || data.length === 0 ? (
          <QueueEmptyState />
        ) : (
          <>
            <QueueDesktopTable data={data} />
            <QueueMobileCards data={data} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
