import { apiCall, apiCallPaginated, apiClient } from './base';

// Types based on backend schema
export type OrderStatus =
  | 'AWAITING_PAYMENT'
  | 'PROCESSING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CONFIRMED';

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

export interface Outlet {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface Order {
  id: string;
  totalAmount: number;
  bookingDate?: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  discountAmount: number;
  guestCustomerId: string;
  guestCustomer: GuestCustomer;
  outletId: string;
  outlet: Outlet;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface GoodsOrder extends Order {
  // Specific for goods orders
}

export interface QueueEntry extends Order {
  // Specific for service queue
  position?: number;
  queueNumber?: number;
  productName?: string;
  customerName: string;
  status: OrderStatus;
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

  // Create order (manual order)
  async create(data: CreateOrderRequest): Promise<{
    orderId: string;
    totalAmount: number;
    midtransTransactionToken?: string;
    midtransRedirectUrl?: string;
  }> {
    return apiCall<{
      orderId: string;
      totalAmount: number;
      midtransTransactionToken?: string;
      midtransRedirectUrl?: string;
    }>('/orders', {
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
