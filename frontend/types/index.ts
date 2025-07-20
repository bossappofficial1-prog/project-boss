// types/index.ts
// Generated TypeScript types for Nuxt frontend based on Prisma schema

// =============================================
// ENUMS
// =============================================

export enum Role {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER'
}

export enum ProductType {
  GOODS = 'GOODS',
  SERVICE = 'SERVICE'
}

export enum OrderPaymentStatus {
  AUTHORIZE = 'AUTHORIZE',
  CAPTURE = 'CAPTURE',
  SETTLEMENT = 'SETTLEMENT',
  DENY = 'DENY',
  PENDING = 'PENDING',
  CANCEL = 'CANCEL',
  REFUND = 'REFUND',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
  CHARGEBACK = 'CHARGEBACK',
  PARTIAL_CHARGEBACK = 'PARTIAL_CHARGEBACK',
  EXPIRE = 'EXPIRE',
  FAILURE = 'FAILURE'
}

export enum OrderQueueStatus {
  CREATED = 'CREATED',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  IN_QUEUE = 'IN_QUEUE',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  FAILED_PROCESSING = 'FAILED_PROCESSING',
  UNKNOWN = 'UNKNOWN'
}

export enum TransactionStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export enum FeeBearer {
  CUSTOMER = 'CUSTOMER',
  OWNER = 'OWNER'
}

export enum ServiceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export enum MemberType {
  REGULAR = 'REGULAR',
  VIP = 'VIP',
  PREMIUM = 'PREMIUM'
}

export enum BookingSlotStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  BLOCKED = 'BLOCKED'
}

export enum CustomerType {
  REGISTERED = 'REGISTERED',
  GUEST = 'GUEST'
}

// =============================================
// BASE TYPES (WITH OPTIONAL RELATIONS)
// =============================================

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  password: string
  role: Role
  isVerified: boolean
  verificationCode?: string
  verificationCodeExpires?: Date
  phone?: string
  createdAt: Date
  updatedAt: Date
  // Relations
  business?: Business
  orders?: Order[]
  memberships?: Membership[]
}

export interface Business {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  bankName?: string
  bankAccount?: string
  accountHolder?: string
  ownerId: string
  defaultTransactionFeeBearer: FeeBearer
  // Relations
  owner?: User
  outlets?: Outlet[]
  wallet?: Wallet
  memberships?: Membership[]
}

export interface Outlet {
  id: string
  name: string
  address?: string
  phone?: string
  createdAt: Date
  updatedAt: Date
  image?: string
  businessId: string
  // Relations
  business?: Business
  products?: Product[]
  orders?: Order[]
  expenses?: Expense[]
}

export interface Product {
  id: string
  name: string
  description?: string
  costPrice: number
  price: number
  type: ProductType
  quantity?: number
  unit?: string
  status: ServiceStatus
  transactionFeeBearer?: FeeBearer
  serviceDurationMinutes?: number
  outletId: string
  image?: string
  createdAt: Date
  updatedAt: Date
  // Relations
  outlet?: Outlet
  orderItems?: OrderItem[]
  bookingSlots?: BookingSlot[]
}

export interface BookingSlot {
  id: string
  date: Date
  startTime: Date
  endTime: Date
  status: BookingSlotStatus
  productId: string
  orderId?: string
  createdAt: Date
  updatedAt: Date
  // Relations
  product?: Product
  order?: Order
}

export interface GuestCustomer {
  id: string
  name: string
  email?: string
  phone?: string
  createdAt: Date
  // Relations
  orders?: Order[]
}

export interface Order {
  id: string
  totalAmount: number
  bookingDate?: Date
  customerType: CustomerType
  paymentStatus: OrderPaymentStatus
  queueStatus: OrderQueueStatus
  midtransTransactionToken?: string
  midtransRedirectUrl?: string
  midtransTransactionDetails?: any
  customerId?: string
  guestCustomerId?: string
  outletId: string
  createdAt: Date
  updatedAt: Date
  // Relations
  customer?: User
  guestCustomer?: GuestCustomer
  outlet?: Outlet
  items?: OrderItem[]
  transaction?: Transaction
  bookingSlot?: BookingSlot
}

export interface OrderItem {
  id: string
  quantity: number
  priceAtTimeOfOrder: number
  orderId: string
  productId: string
  // Relations
  order?: Order
  product?: Product
}

export interface Transaction {
  id: string
  amount: number
  paymentMethod?: string
  status: TransactionStatus
  externalId?: string
  fee: number
  adminFee: number
  feePaidBy?: string
  paidAt?: Date
  orderId: string
  createdAt: Date
  // Relations
  order?: Order
}

export interface Wallet {
  id: string
  balance: number
  businessId: string
  updatedAt: Date
  // Relations
  business?: Business
  withdrawals?: Withdrawal[]
}

export interface Withdrawal {
  id: string
  amount: number
  applicationFee: number
  bankTransferFee: number
  status: WithdrawalStatus
  notes?: string
  walletId: string
  createdAt: Date
  updatedAt: Date
  // Relations
  wallet?: Wallet
}

export interface Expense {
  id: string
  description: string
  amount: number
  date: Date
  outletId: string
  createdAt: Date
  // Relations
  outlet?: Outlet
}

export interface Membership {
  id: string
  memberCode: string
  memberType: MemberType
  discountPercentage: number
  isActive: boolean
  notes?: string
  customerId: string
  businessId: string
  createdAt: Date
  updatedAt: Date
  // Relations
  customer?: User
  business?: Business
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

// =============================================
// FORM TYPES
// =============================================

export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  name: string
  password: string
  confirmPassword: string
  phone?: string
}

export interface BusinessForm {
  name: string
  description?: string
  bankName?: string
  bankAccount?: string
  accountHolder?: string
  defaultTransactionFeeBearer: FeeBearer
}

export interface OutletForm {
  name: string
  address?: string
  phone?: string
  image?: string
}

export interface ProductForm {
  name: string
  description?: string
  costPrice: number
  price: number
  type: ProductType
  quantity?: number
  unit?: string
  status: ServiceStatus
  transactionFeeBearer?: FeeBearer
  serviceDurationMinutes?: number
  image?: string
}

export interface OrderForm {
  outletId: string
  customerType: CustomerType
  bookingDate?: Date
  items: {
    productId: string
    quantity: number
  }[]
  customer?: {
    name: string
    email?: string
    phone?: string
  }
}

export interface BookingSlotForm {
  productId: string
  date: Date
  startTime: Date
  endTime: Date
}

export interface ExpenseForm {
  description: string
  amount: number
  date: Date
  outletId: string
}

export interface MembershipForm {
  customerId: string
  businessId: string
  memberType: MemberType
  discountPercentage: number
  notes?: string
}

// =============================================
// DASHBOARD TYPES
// =============================================

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  revenueGrowth: number
  orderGrowth: number
}

export interface RevenueChart {
  date: string
  revenue: number
  orders: number
}

export interface TopProduct {
  id: string
  name: string
  totalSold: number
  revenue: number
}
