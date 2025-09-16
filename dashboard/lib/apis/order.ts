import { apiCall } from './base';

export type GoodsOrderItem = {
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  notes?: string;
};

export type GoodsOrder = {
  id: string;
  outletId?: string;
  code?: string;
  customerName: string;
  customerPhone: string;
  status?: string; // legacy
  orderStatus?: string; // backend field
  paymentStatus?: string;
  totalAmount: number;
  createdAt: string;
  items: GoodsOrderItem[];
};

export type QueueEntry = {
  id: string;
  customerName: string;
  position?: number; // backend field
  queueNumber?: number; // optional alias used by UI
  status: string;
  estimatedTime?: number;
  createdAt: string;
  productName?: string;
};

export const orderApi = {
  getByOutlet: async (outletId: string, params?: { status?: string; limit?: number; }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    const qs = searchParams.toString();
    const endpoint = `/orders/${outletId}/goods${qs ? `?${qs}` : ''}`;
    const raw = await apiCall<any[]>(endpoint);
    // Map backend order shape to UI-friendly shape
    const mapped: GoodsOrder[] = (raw || []).map((o: any) => ({
      id: o.id,
      outletId: o.outletId,
      code: o.id,
      customerName: o.guestCustomer?.name ?? '-',
      customerPhone: o.guestCustomer?.phone ?? '-',
      orderStatus: o.orderStatus,
      paymentStatus: o.paymentStatus,
      totalAmount: o.totalAmount,
  createdAt: typeof o.createdAt === 'string' || o.createdAt instanceof Date ? (o.createdAt as any) : (o.createdAt?.toString?.() || o.createdAt),
      items: (o.items || []).map((it: any) => ({
        productId: it.productId,
        productName: it.product?.name,
        quantity: it.quantity,
        price: it.priceAtTimeOfOrder,
        notes: it.notes,
      })),
    }));
    return mapped;
  },

  getQueue: async (outletId: string) => {
    const raw = await apiCall<any[]>(`/orders/${outletId}/queue`);
    const mapped: QueueEntry[] = (raw || []).map((o: any, idx: number) => ({
      id: o.id,
      customerName: o.guestCustomer?.name ?? '-',
      queueNumber: o.position ?? idx + 1,
      position: o.position ?? idx + 1,
      status: o.orderStatus ?? o.status ?? 'READY',
      estimatedTime: undefined,
  createdAt: typeof o.createdAt === 'string' || o.createdAt instanceof Date ? (o.createdAt as any) : (o.createdAt?.toString?.() || o.createdAt),
      productName: o.items?.[0]?.product?.name,
    }));
    return mapped;
  },
};
