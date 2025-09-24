"use client";

import { useState } from 'react';
import { Suspense } from 'react';
import { useOutletQueue } from '@/hooks/useOrders';
import { useOutletContext } from '@/components/providers/OutletProvider';
import { QuickOrderModal } from '@/components/modals/QuickOrderModal';
import { QueueHeader } from '@/components/owner/queue/Header';
import { QueueControls } from '@/components/owner/queue/Controls';
import { QueueDesktopTable } from '@/components/owner/queue/DesktopTable';
import { QueueMobileCards } from '@/components/owner/queue/MobileCards';
import { QueueEmptyState } from '@/components/owner/queue/EmptyState';
import { QueueSkeleton } from '@/components/owner/queue/Skeleton';

export default function QueuePage() {
  const { selectedOutletId } = useOutletContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [showQuickModal, setShowQuickModal] = useState(false);

  const {
    data: queueData,
    loading: isLoading,
    error,
    refetch: refreshQueue
  } = useOutletQueue({
    outletId: selectedOutletId,
    autoRefresh: true,
  });

  const handleRefresh = () => {
    refreshQueue();
  };

  const handleQuickOrderSuccess = () => {
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
      (statusFilter === 'pending' && item.status === 'PROCESSING') ||
      (statusFilter === 'in_progress' && item.status === 'READY') ||
      (statusFilter === 'completed' && item.status === 'COMPLETED');

    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <>
      <div className="space-y-6">
        <QueueHeader
          onRefresh={handleRefresh}
          onCreateQuick={() => setShowQuickModal(true)}
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
              onCreateQueue={() => setShowQuickModal(true)}
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <QueueDesktopTable
                  queue={filteredQueue}
                  onRefresh={refreshQueue}
                />
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden">
                <QueueMobileCards
                  queue={filteredQueue}
                  onRefresh={refreshQueue}
                />
              </div>
            </>
          )}
        </Suspense>

        {/* Quick Order Modal */}
        {showQuickModal && selectedOutletId && (
          <QuickOrderModal
            open={showQuickModal}
            onOpenChange={setShowQuickModal}
            outletId={selectedOutletId}
            productType="SERVICE"
            onSuccess={handleQuickOrderSuccess}
          />
        )}
      </div>
    </>
  );
}