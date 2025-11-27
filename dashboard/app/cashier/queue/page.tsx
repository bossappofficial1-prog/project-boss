"use client";

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ShoppingBag } from 'lucide-react';
import { useOutletQueue } from '@/hooks/useOrders';
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
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/apis/base';
import { toast } from 'sonner';
import ThemeToggle from '@/components/ThemeToggle';
import { authApi } from '@/lib/api';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { CashierOutletProvider } from '@/components/providers/CashierOutletProvider';

// Inner component that uses contexts
function CashierQueueContent({ cashierData, outletData }: { cashierData: any; outletData: any }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  const outletId = outletData?.id;

  const {
    data: queueData,
    loading: isLoading,
    error,
    refetch: refreshQueue,
    setQueueData,
  } = useOutletQueue({
    outletId,
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

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
      toast.success('Logout berhasil');
      router.push('/auth/login/cashier');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Gagal logout');
    }
  };

  useEffect(() => {
    if (!outletId || !isConnected) {
      return;
    }

    emitEvent(SOCKET_EVENT.JOIN_OUTLET, { outletId });
  }, [emitEvent, isConnected, outletId]);

  const handleQueueSnapshot = useCallback((payload: SocketEvents[typeof SOCKET_EVENT.QUEUE_UPDATED]) => {
    if (!payload) {
      return;
    }

    if (payload.outletId !== outletId) {
      return;
    }

    if (Array.isArray(payload.queue)) {
      setQueueData(payload.queue);
    }
  }, [outletId, setQueueData]);

  useSocketEvent(SOCKET_EVENT.QUEUE_UPDATED, handleQueueSnapshot, {
    enabled: Boolean(outletId),
  });

  const handleRefresh = () => {
    refreshQueue();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="mx-auto max-w-[1500px] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold">Antrian Layanan - {outletData?.name}</h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Kasir: {cashierData?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>
        <div className="min-h-[400px] flex items-center justify-center">
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
      </div>
    );
  }

  // Filter data based on search and status
  const filteredQueue = queueData?.filter(item => {
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      item.customerName?.toLowerCase().includes(normalizedSearch) ||
      item.productName?.toLowerCase().includes(normalizedSearch) ||
      item.queueNumber?.toString().includes(searchTerm) ||
      item.assignedStaff?.name?.toLowerCase().includes(normalizedSearch) ||
      item.bookingSlot?.staff?.name?.toLowerCase().includes(normalizedSearch);

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'pending' && ['AWAITING_PAYMENT', 'CONFIRMED', 'PROCESSING'].includes(item.status as string)) ||
      (statusFilter === 'in_progress' && ['READY', 'ON_GOING'].includes(item.status as string)) ||
      (statusFilter === 'completed' && item.status === 'COMPLETED');

    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="mx-auto max-w-[1500px] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-lg font-semibold">Antrian Layanan - {outletData?.name}</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Kasir: {cashierData?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => router.push('/cashier/pos')} 
              variant="outline" 
              size="sm"
            >
              Kembali ke POS
            </Button>
            <ThemeToggle />
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] p-4 space-y-6">
        <QueueHeader
          onRefresh={handleRefresh}
          onCreateQuick={() => router.push('/cashier/pos')}
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
              onCreateQueue={() => router.push('/cashier/pos')}
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
    </div>
  );
}

// Main component with auth and providers
export default function CashierQueuePage() {
  const router = useRouter();
  const [cashierData, setCashierData] = useState<any>(null);
  const [outletData, setOutletData] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
      toast.success('Logout berhasil');
      router.push('/auth/login/cashier');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Gagal logout');
    }
  };

  // Fetch cashier data on mount
  useEffect(() => {
    const fetchCashierData = async () => {
      try {
        setIsLoadingAuth(true);
        const response = await authApi.cashierMe();
        setCashierData(response);
        
        if (response.outlet) {
          setOutletData(response.outlet);
        }
      } catch (error) {
        console.error('Failed to fetch cashier data:', error);
        toast.error('Sesi login tidak valid, silakan login kembali');
        router.push('/auth/login/cashier');
      } finally {
        setIsLoadingAuth(false);
      }
    }

    fetchCashierData();
  }, [router]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Memuat data kasir...</p>
        </div>
      </div>
    );
  }

  if (!cashierData || !outletData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="mx-auto max-w-[1500px] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold">Antrian Layanan</h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Sistem Kasir
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Data Outlet Tidak Tersedia
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Hubungi owner untuk mengatur akun kasir Anda
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SocketProvider outletId={outletData.id}>
      <CashierOutletProvider outlet={outletData}>
        <CashierQueueContent cashierData={cashierData} outletData={outletData} />
      </CashierOutletProvider>
    </SocketProvider>
  );
}
