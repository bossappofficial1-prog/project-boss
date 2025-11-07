"use client";

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useOutletQueue } from '@/hooks/useOrders';
import { useOutletContext } from '@/components/providers/OutletProvider';
import { QueueHeader } from '@/components/owner/queue/Header';
import { QueueControls } from '@/components/owner/queue/Controls';
import { QueueDesktopTable } from '@/components/owner/queue/DesktopTable';
import { QueueMobileCards } from '@/components/owner/queue/MobileCards';
import { QueueEmptyState } from '@/components/owner/queue/EmptyState';
import { QueueSkeleton } from '@/components/owner/queue/Skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useQueueStatusActions } from '@/hooks/useQueueActions';
import { useEmitSocket } from '@/hooks/useEmitSocket';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { SOCKET_EVENT, type SocketEvents } from '@/types/socket';

export default function QueuePage() {
  const { selectedOutletId } = useOutletContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  const {
    data: queueData,
    loading: isLoading,
    error,
    refetch: refreshQueue,
    setQueueData,
  } = useOutletQueue({
    outletId: selectedOutletId,
    autoRefresh: false,
  });

  const { emitEvent, isConnected } = useEmitSocket();

  const {
    pendingQueueId,
    confirmOpen,
    setConfirmOpen,
    confirmState,
    executeStatusUpdate,
    requestStatusChange,
    requestPrimaryAction,
    getPrimaryAction,
  } = useQueueStatusActions({
    onSuccess: refreshQueue,
  });

  useEffect(() => {
    if (!selectedOutletId || !isConnected) {
      return;
    }

    emitEvent(SOCKET_EVENT.JOIN_OUTLET, { outletId: selectedOutletId });
  }, [emitEvent, isConnected, selectedOutletId]);

  const handleQueueSnapshot = useCallback((payload: SocketEvents[typeof SOCKET_EVENT.QUEUE_UPDATED]) => {
    if (!payload) {
      return;
    }

    if (payload.outletId !== selectedOutletId) {
      return;
    }

    if (Array.isArray(payload.queue)) {
      setQueueData(payload.queue);
    }
  }, [selectedOutletId, setQueueData]);

  useSocketEvent(SOCKET_EVENT.QUEUE_UPDATED, handleQueueSnapshot, {
    enabled: Boolean(selectedOutletId),
  });

  const handleRefresh = () => {
    refreshQueue();
  };

  if (!selectedOutletId) {
    return (
      <>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Pilih Outlet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Pilih outlet untuk melihat data antrian jasa
            </p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>        <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Gagal memuat data
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {typeof error === 'string' ? error : 'Terjadi kesalahan saat memuat antrian'}
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
      </>
    );
  }

  // Filter data based on search and status
  const filteredQueue = queueData?.filter(item => {
    const matchesSearch = !searchTerm ||
      item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.queueNumber?.toString().includes(searchTerm);

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'pending' && ['AWAITING_PAYMENT', 'CONFIRMED', 'PROCESSING'].includes(item.status as string)) ||
      (statusFilter === 'in_progress' && ['READY', 'ON_GOING'].includes(item.status as string)) ||
      (statusFilter === 'completed' && item.status === 'COMPLETED');

    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <>
      <div className="space-y-6">
        <QueueHeader
          onRefresh={handleRefresh}
          onCreateQuick={() => window.location.href = '/owner/dashboard/pos/queue'}
        />

        <QueueControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        <Suspense fallback={<QueueSkeleton />}>
          {isLoading ? (
            <QueueSkeleton />
          ) : !filteredQueue.length ? (
            <QueueEmptyState
              hasFilters={!!searchTerm || statusFilter !== 'all'}
              onClearFilters={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              onCreateQueue={() => window.location.href = '/owner/dashboard/pos/queue'}
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <QueueDesktopTable
                  queue={filteredQueue}
                  pendingQueueId={pendingQueueId}
                  onStatusChange={requestStatusChange}
                  onPrimaryAction={requestPrimaryAction}
                  getPrimaryAction={getPrimaryAction}
                />
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden">
                <QueueMobileCards
                  queue={filteredQueue}
                  pendingQueueId={pendingQueueId}
                  onStatusChange={requestStatusChange}
                  onPrimaryAction={requestPrimaryAction}
                  getPrimaryAction={getPrimaryAction}
                />
              </div>
            </>
          )}
        </Suspense>
      </div>
      <ConfirmDialog
        open={confirmOpen && Boolean(confirmState)}
        onOpenChange={setConfirmOpen}
        title={confirmState?.title ?? 'Konfirmasi'}
        description={confirmState?.description}
        confirmLabel={confirmState?.confirmLabel ?? 'Konfirmasi'}
        confirmVariant={confirmState?.confirmVariant}
        confirmLoading={Boolean(pendingQueueId)}
        onConfirm={executeStatusUpdate}
        align="left"
      />
    </>
  );
}