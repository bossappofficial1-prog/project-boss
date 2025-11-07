import { useState, useEffect, useCallback } from 'react';
import { orderApi, type GoodsOrder, type QueueEntry, type OrderStatus, type OrderListParams } from '@/lib/apis/order';
import { authApi } from '@/lib/api';

const toDate = (value: unknown): Date | null => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const candidate = new Date(value);
    if (!Number.isNaN(candidate.getTime())) {
      return candidate;
    }
  }

  return null;
};

const toIsoString = (value: unknown): string | null => {
  const date = toDate(value);
  return date ? date.toISOString() : null;
};

const transformQueueEntries = (entries: any[]): QueueEntry[] => {
  const sortKey = (entry: any) => {
    const raw = entry?.queueMeta?.scheduledStart
      ?? entry?.bookingSlot?.startTime
      ?? entry?.bookingDate
      ?? entry?.createdAt;
    const date = toDate(raw);
    return date ? date.getTime() : Number.MAX_SAFE_INTEGER;
  };

  const sorted = [...(entries ?? [])].sort((a, b) => {
    const timeDiff = sortKey(a) - sortKey(b);
    if (timeDiff !== 0) {
      return timeDiff;
    }

    const positionA = a?.queueMeta?.position ?? a?.position ?? a?.queueNumber ?? Number.MAX_SAFE_INTEGER;
    const positionB = b?.queueMeta?.position ?? b?.position ?? b?.queueNumber ?? Number.MAX_SAFE_INTEGER;
    return positionA - positionB;
  });

  return sorted.map((item, index) => {
    const queueMeta = item?.queueMeta ?? null;
    const basePosition = queueMeta?.position ?? item?.position ?? item?.queueNumber ?? index + 1;
    const scheduledStartSource = item?.scheduledStart
      ?? queueMeta?.scheduledStart
      ?? item?.bookingSlot?.startTime
      ?? item?.bookingDate;
    const scheduledEndSource = queueMeta?.scheduledEnd ?? item?.bookingSlot?.endTime;

    const normalizedQueueMeta = queueMeta
      ? {
        ...queueMeta,
        position: basePosition,
        totalAhead: queueMeta.totalAhead ?? Math.max(0, basePosition - 1),
  totalOrders: queueMeta.totalOrders ?? item?.queueMeta?.totalOrders ?? 0,
        scheduledStart: toIsoString(scheduledStartSource),
        scheduledEnd: toIsoString(scheduledEndSource),
        status: (queueMeta.status ?? item?.status ?? item?.orderStatus ?? 'PROCESSING') as QueueEntry['status'],
      }
      : null;

    const resolvedStatus = (item?.status ?? item?.orderStatus ?? normalizedQueueMeta?.status ?? 'PROCESSING') as QueueEntry['status'];

    return {
      ...item,
      position: basePosition,
      queueNumber: item?.queueNumber ?? basePosition,
      status: resolvedStatus,
      scheduledStart: toIsoString(scheduledStartSource),
      customerName: item?.customerName ?? item?.guestCustomer?.name ?? 'Unknown',
      productName: item?.productName ?? item?.items?.[0]?.product?.name ?? 'Service',
      queueMeta: normalizedQueueMeta,
    } as QueueEntry;
  });
};

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

export interface UseQueueResult<T> extends UseOrdersResult<T> {
  setQueueData: (entries: T[] | any[]) => void;
}

export function useOutletQueue({
  outletId,
  autoRefresh = false,
  refreshInterval = 15000, // 15 seconds for queue (more frequent)
}: UseQueueParams): UseQueueResult<QueueEntry> {
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

  const applyQueueEntries = useCallback((rawEntries: any[], meta?: Partial<{ page: number; total: number; limit: number; totalPages: number }>) => {
    const transformed = transformQueueEntries(rawEntries);

    setData(transformed);
    setPagination((prev) => {
      const limit = meta?.limit ?? prev.limit;
      const total = meta?.total ?? transformed.length;
      const totalPages = meta?.totalPages ?? Math.max(1, Math.ceil(total / (limit || 1)));
      const currentPageValue = meta?.page ?? Math.min(prev.currentPage, totalPages);

      return {
        currentPage: currentPageValue,
        totalPages,
        total,
        limit,
      };
    });
  }, [setData, setPagination]);

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

      applyQueueEntries(response.data || [], {
        page: response.page || 1,
        totalPages: response.totalPages || 1,
        total: response.total || 0,
        limit: response.limit || pagination.limit,
      });
    } catch (err: any) {
      console.error('Error fetching queue:', err);
      setError(err.message || 'Failed to fetch queue');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [outletId, currentPage, pagination.limit, applyQueueEntries]);

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

  const setQueueData = useCallback((entries: any[]) => {
    applyQueueEntries(entries);
  }, [applyQueueEntries]);

  return {
    data,
    loading,
    error,
    pagination,
    refetch: fetchQueue,
    setPage,
    setStatus,
    setQueueData,
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