// types/index.ts (atau types/queue.ts)
export enum OrderQueueStatus {
  IN_QUEUE = 'IN_QUEUE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum ProductType {
  GOODS = 'GOODS',
  SERVICE = 'SERVICE'
}

export interface Product {
  id: string
  name: string
  description: string
  costPrice: number
  price: number
  type: ProductType
  quantity?: number
  unit?: string
  status: string
  transactionFeeBearer?: string
  serviceDurationMinutes?: number
  outletId: string
  image?: string
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  quantity: number
  priceAtTimeOfOrder: number
  orderId: string
  productId: string
  product: Product
}

export interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  createdAt: string
  updatedAt?: string
}

export interface GuestCustomer {
  id: string
  name: string
  email: string
  phone?: string
  createdAt: string
}

export interface BookingSlot {
  id: string
  date: string
  startTime: string
  endTime: string
  isBooked: boolean
}

export interface Order {
  position?: number
  id: string
  totalAmount: number
  bookingDate?: string
  customerType: 'REGISTERED' | 'GUEST'
  paymentStatus: string
  paymentReminderSent: boolean
  orderStatus: string
  queueStatus: OrderQueueStatus
  midtransTransactionToken?: string
  midtransRedirectUrl?: string
  midtransFee?: number
  appFee?: number
  chargedTo?: string
  promoId?: string
  discountAmount?: number
  customerId?: string
  guestCustomerId?: string
  outletId: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  customer?: Customer
  guestCustomer?: GuestCustomer
  bookingSlot?: BookingSlot
}

export interface ApiResponse<T> {
  success: boolean
  message: string | number
  data: T
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  timestamp: string
  path: string
}