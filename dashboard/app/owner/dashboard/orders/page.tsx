"use client";

import { useState } from 'react';
import { useGoodsOrders } from '@/hooks/useOrders';
import { useOutletContext } from '@/components/providers/OutletProvider';
import { OrdersDesktopTable } from '@/components/owner/orders/DesktopTable';
import { OrdersMobileCards } from '@/components/owner/orders/MobileCards';
import { OrdersHeader } from '@/components/owner/orders/Header';
import { OrdersControls } from '@/components/owner/orders/Controls';
import { OrdersEmptyState } from '@/components/owner/orders/EmptyState';
import { OrdersSkeleton } from '@/components/owner/orders/Skeleton';
import { QuickOrderModal } from '@/components/modals/QuickOrderModal';

export default function OrdersPage() {
  const { selectedOutletId: outletId } = useOutletContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'ready' | 'completed'>('all');
  const [showQuickOrderModal, setShowQuickOrderModal] = useState(false);

  const {
    data: orders,
    loading,
    error,
    refetch,
  } = useGoodsOrders({
    outletId,
    autoRefresh: true,
    refreshInterval: 30000,
  });

  // Filter orders based on status and search
  const filteredOrders = (orders || []).filter(order => {
    // Don't show completed orders unless specifically filtering for them
    if (order.orderStatus === 'COMPLETED' && statusFilter !== 'completed') return false;

    // Status filter
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'pending' && order.orderStatus === 'AWAITING_PAYMENT') ||
      (statusFilter === 'processing' && order.orderStatus === 'PROCESSING') ||
      (statusFilter === 'ready' && order.orderStatus === 'READY') ||
      (statusFilter === 'completed' && order.orderStatus === 'COMPLETED');

    // Search filter
    const matchesSearch = !searchQuery ||
      order.guestCustomer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.guestCustomer?.phone?.includes(searchQuery) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleQuickOrderSuccess = () => {
    refetch();
  };

  if (!outletId) {
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
              Pilih outlet untuk melihat data pesanan barang
            </p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Gagal memuat data
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {typeof error === 'string' ? error : 'Terjadi kesalahan saat memuat pesanan'}
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

  return (
    <>
      <div className="space-y-6">
        <OrdersHeader
          onRefresh={handleRefresh}
          onCreateQuick={() => setShowQuickOrderModal(true)}
        />

        <OrdersControls
          searchTerm={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {loading ? (
          <OrdersSkeleton />
        ) : !filteredOrders.length ? (
          <OrdersEmptyState
            hasFilters={!!searchQuery || statusFilter !== 'all'}
            onClearFilters={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            onCreateOrder={() => setShowQuickOrderModal(true)}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <OrdersDesktopTable
                orders={filteredOrders}
                onRefresh={refetch}
              />
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden">
              <OrdersMobileCards
                orders={filteredOrders}
                onRefresh={refetch}
              />
            </div>
          </>
        )}

        {/* Quick Order Modal */}
        {showQuickOrderModal && outletId && (
          <QuickOrderModal
            open={showQuickOrderModal}
            onOpenChange={setShowQuickOrderModal}
            outletId={outletId}
            productType="GOODS"
            onSuccess={handleQuickOrderSuccess}
          />
        )}
      </div>
    </>
  );
}
