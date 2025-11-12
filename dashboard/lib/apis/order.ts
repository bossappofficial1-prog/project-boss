import { apiCall, apiCallPaginated, apiClient } from './base';

// Types based on backend schema
export type OrderStatus =
  | 'AWAITING_PAYMENT'
  | 'PROCESSING'
  | 'CONFIRMED'
  | 'READY'
  | 'ON_GOING'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELLED';

export interface GuestCustomer {
  id: string;
  name: string;
  phone: string;
}

export interface Product {
  id: string;
  name: string;
  type: 'GOODS' | 'SERVICE';
  price: number;
}

export interface OrderItem {
  id: string;
  quantity: number;
  priceAtTimeOfOrder: number;
  productId: string;
  product: Product;
}

export type OnlinePaymentChannel = 'qris_dynamic' | 'va_bca' | 'ewallet_gopay';

export interface MidtransInstruction {
  title: string;
  steps: string[];
}

export interface MidtransOnlineDetail {
  channel: OnlinePaymentChannel;
  amount: number;
  currency?: string;
  expiredAt?: string;
  referenceId?: string;
  qrString?: string;
  qrUrl?: string;
  deeplinkUrl?: string;
  paymentCode?: string;
  accountName?: string;
  vaNumbers?: {
    bank: string;
    vaNumber: string;
  }[];
  instructions?: MidtransInstruction[];
}

export interface TransactionSummary {
  id: string;
  status: PaymentStatus;
  isManual: boolean;
  paymentMethod: 'cash' | 'qris' | 'online' | 'manual_transfer';
  paymentUrl?: string | null;
  midtrans?: MidtransOnlineDetail | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Outlet {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface StaffSummary {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  role?: string | null;
}

export interface Order {
  id: string;
  totalAmount: number;
  bookingDate?: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  discountAmount: number;
  appFee?: number;
  midtransFee?: number;
  chargedTo?: 'CUSTOMER' | 'OWNER';
  paymentMethod?: 'cash' | 'qris' | 'online' | 'manual_transfer';
  guestCustomerId: string;
  guestCustomer: GuestCustomer;
  outletId: string;
  outlet: Outlet;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  bookingSlot?: {
    id: string;
    date?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    status?: string;
    productId?: string;
    staffId?: string | null;
    staff?: StaffSummary | null;
  } | null;
  assignedStaffId?: string | null;
  assignedStaff?: StaffSummary | null;
}

export interface GoodsOrder extends Order {
  // Specific for goods orders
}

export interface QueueMeta {
  position: number;
  totalAhead: number;
  totalOrders: number;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  status: OrderStatus;
}

export interface QueueEntry extends Order {
  // Specific for service queue
  position?: number;
  queueNumber?: number;
  productName?: string;
  customerName: string;
  status: OrderStatus;
  queueMeta?: QueueMeta | null;
  scheduledStart?: string | null;
}

export interface CreateOrderRequest {
  guestCustomer: {
    name: string;
    phone: string;
  };
  outletId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  bookingDate?: string;
  paymentMethod?: 'qris' | 'online' | 'cash';
  bookingSlotId?: string;
  staffId?: string;
  onlinePaymentChannel?: OnlinePaymentChannel;
}

export interface CreateOrderResponse {
  order: Order;
  transaction: TransactionSummary;
}

export interface PosCashSummary {
  outletId: string;
  totalAmount: number;
  transactionsCount: number;
  date: string;
  startTime: string;
  endTime: string;
}

export interface OrderListParams {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const orderApi = {
  // Get goods orders by outlet
  async getGoodsByOutlet(
    outletId: string,
    params?: OrderListParams
  ): Promise<PaginatedResponse<GoodsOrder>> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const url = `/orders/${outletId}/goods${queryString ? `?${queryString}` : ''}`;

    return apiCallPaginated<GoodsOrder>(url);
  },

  // Get service queue by outlet
  async getQueueByOutlet(
    outletId: string,
    params?: Omit<OrderListParams, 'status'>
  ): Promise<PaginatedResponse<QueueEntry>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const url = `/orders/${outletId}/queue${queryString ? `?${queryString}` : ''}`;

    return apiCallPaginated<QueueEntry>(url);
  },

  async getPosCashSummary(outletId: string, date?: string): Promise<PosCashSummary> {
    const searchParams = new URLSearchParams({ outletId });
    if (date) {
      searchParams.append('date', date);
    }

    const url = `/internal/pos/orders/cash-summary?${searchParams.toString()}`;
    return apiCall<PosCashSummary>(url);
  },

  // Create order (manual order)
  async create(data: CreateOrderRequest): Promise<CreateOrderResponse> {
    return apiCall<CreateOrderResponse>('/internal/pos/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update order status
  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    return apiCall<Order>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Update service queue order status with validation
  async updateServiceStatus(orderId: string, status: OrderStatus): Promise<QueueEntry> {
    return apiCall<QueueEntry>(`/orders/${orderId}/service-status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Complete order
  async complete(orderId: string): Promise<Order> {
    return apiCall<Order>(`/orders/${orderId}/complete`, {
      method: 'POST',
    });
  },

  // Get order by ID
  async getById(orderId: string): Promise<Order> {
    return apiCall<Order>(`/orders/${orderId}`);
  },

  // Get order receipt
  async getReceipt(orderId: string): Promise<Blob> {
    const response = await apiClient.get(`/orders/${orderId}/receipt`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Refund order
  async refund(orderId: string): Promise<Order> {
    return apiCall<Order>(`/orders/${orderId}/refund`, {
      method: 'POST',
    });
  },
};

export default orderApi;
