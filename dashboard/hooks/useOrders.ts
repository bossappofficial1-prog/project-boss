import { useState, useEffect, useCallback } from 'react';
import { orderApi, type GoodsOrder, type QueueEntry, type OrderStatus, type OrderListParams } from '@/lib/apis/order';
import { authApi } from '@/lib/api';

export interface UseGoodsOrdersParams {
  outletId: string | null;
  status?: OrderStatus;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseOrdersResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
  };
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setStatus: (status: OrderStatus | undefined) => void;
}

export function useGoodsOrders({
  outletId,
  status,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: UseGoodsOrdersParams): UseOrdersResult<GoodsOrder> {
  const [data, setData] = useState<GoodsOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 20,
  });
  const [currentStatus, setCurrentStatus] = useState<OrderStatus | undefined>(status);

  const fetchOrders = useCallback(async () => {
    if (!outletId) {
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params: OrderListParams = {
        page: currentPage,
        limit: pagination.limit,
      };

      if (currentStatus) {
        params.status = currentStatus;
      }

      const response = await orderApi.getGoodsByOutlet(outletId, params);

      setData(response.data || []);
      setPagination({
        currentPage: response.page || 1,
        totalPages: response.totalPages || 1,
        total: response.total || 0,
        limit: response.limit || 20,
      });
    } catch (err: any) {
      console.error('Error fetching goods orders:', err);
      setError(err.message || 'Failed to fetch orders');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [outletId, currentPage, pagination.limit, currentStatus]);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const setStatus = useCallback((status: OrderStatus | undefined) => {
    setCurrentStatus(status);
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  // Initial fetch and fetch when dependencies change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !outletId) return;

    const interval = setInterval(() => {
      fetchOrders();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchOrders, outletId]);

  return {
    data,
    loading,
    error,
    pagination,
    refetch: fetchOrders,
    setPage,
    setStatus,
  };
}

export interface UseQueueParams {
  outletId: string | null;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useOutletQueue({
  outletId,
  autoRefresh = true,
  refreshInterval = 15000, // 15 seconds for queue (more frequent)
}: UseQueueParams): UseOrdersResult<QueueEntry> {
  const [data, setData] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 50, // More items for queue
  });

  const fetchQueue = useCallback(async () => {
    if (!outletId) {
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: pagination.limit,
      };

      const response = await orderApi.getQueueByOutlet(outletId, params);

      const sortKey = (entry: QueueEntry) => {
        const raw = entry.queueMeta?.scheduledStart
          ?? entry.bookingSlot?.startTime
          ?? entry.bookingDate
          ?? entry.createdAt;
        const date = raw ? new Date(raw) : null;
        return date && !Number.isNaN(date.getTime()) ? date.getTime() : Number.MAX_SAFE_INTEGER;
      };

      const sorted = [...(response.data || [])].sort((a, b) => {
        const diff = sortKey(a) - sortKey(b);
        if (diff !== 0) return diff;
        const posA = a.queueMeta?.position ?? a.position ?? 0;
        const posB = b.queueMeta?.position ?? b.position ?? 0;
        return posA - posB;
      });

      const transformedData = sorted.map((item, index) => {
        const scheduledStart = item.queueMeta?.scheduledStart
          ?? item.bookingSlot?.startTime
          ?? item.bookingDate
          ?? item.createdAt;

        return {
          ...item,
          scheduledStart: scheduledStart ?? null,
          position: item.queueMeta?.position ?? item.position ?? index + 1,
          queueNumber: item.queueNumber ?? item.queueMeta?.position ?? index + 1,
          customerName: item.guestCustomer?.name || 'Unknown',
          productName: item.items?.[0]?.product?.name || 'Service',
          status: item.orderStatus || 'PROCESSING',
        } as QueueEntry;
      });

      setData(transformedData);
      setPagination({
        currentPage: response.page || 1,
        totalPages: response.totalPages || 1,
        total: response.total || 0,
        limit: response.limit || 20,
      });
    } catch (err: any) {
      console.error('Error fetching queue:', err);
      setError(err.message || 'Failed to fetch queue');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [outletId, currentPage, pagination.limit]);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const setStatus = useCallback((_status: OrderStatus | undefined) => {
    // Queue doesn't filter by status, but we keep the interface consistent
  }, []);

  // Initial fetch and fetch when dependencies change
  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !outletId) return;

    const interval = setInterval(() => {
      fetchQueue();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchQueue, outletId]);

  return {
    data,
    loading,
    error,
    pagination,
    refetch: fetchQueue,
    setPage,
    setStatus,
  };
}

// Hook for selected outlet ID (shared between orders and queue)
export function useSelectedOutletId() {
  const [outletId, setOutletId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Get outlet ID from localStorage or other state management
        const stored = localStorage.getItem('selectedOutlet');

        // If we have a stored outlet, validate it exists in user's outlets
        if (stored) {
          try {
            const me = await authApi.me();
            const validOutlet = me?.outlets?.find((outlet: any) => outlet.id === stored);
            if (validOutlet && !cancelled) {
              setOutletId(stored);
            } else {
              // Stored outlet is invalid, use first available outlet
              const firstOutlet = me?.outlets?.[0]?.id;
              if (firstOutlet) {
                localStorage.setItem('selectedOutlet', firstOutlet);
                if (!cancelled) setOutletId(firstOutlet);
              }
            }
          } catch (error) {
            console.error('Error validating stored outlet:', error);
            // On error, just use stored value as fallback
            if (!cancelled) setOutletId(stored);
          }
        } else {
          // No stored outlet, fetch first available
          try {
            const me = await authApi.me();
            const firstOutlet = me?.outlets?.[0]?.id;
            if (firstOutlet) {
              localStorage.setItem('selectedOutlet', firstOutlet);
              if (!cancelled) setOutletId(firstOutlet);
            }
          } catch (error) {
            console.error('Error fetching first outlet:', error);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    // Listen for outlet changes
    const handleOutletChange = (event: CustomEvent) => {
      // OutletProvider now sends outlet object, not just outletId
      const newOutletId = (event as any).detail.outlet?.id || (event as any).detail.outletId;
      if (newOutletId) {
        setOutletId(newOutletId);
        localStorage.setItem('selectedOutlet', newOutletId);
      }
    };

    window.addEventListener('outletChanged', handleOutletChange as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener('outletChanged', handleOutletChange as EventListener);
    };
  }, []);

  return { outletId, loading };
}