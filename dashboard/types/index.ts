/**
 * Central Type Definitions Export
 * 
 * Import semua types dari sini untuk menghindari import yang tersebar
 * 
 * @example
 * ```typescript
 * import { User, UserRole, ApiResponse, PaginationParams } from '@/types';
 * ```
 */

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  errors?: Record<string, string[]>;
}

// ============================================================================
// QUERY & FILTER TYPES
// ============================================================================

export interface BaseQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams {
  search?: string;
}

export type SortOrder = 'asc' | 'desc';

// ============================================================================
// USER TYPES
// ============================================================================

export enum UserRole {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  USER = 'USER'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isVerified: boolean;
  avatar: string | null;
  status?: UserStatus;
  createdAt: string;
  updatedAt: string;
  business?: Business;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UserFilters extends BaseQueryParams {
  role?: UserRole | 'all';
  status?: 'all' | 'verified' | 'unverified';
  isVerified?: boolean;
}

export interface UserStats {
  total: number;
  verified: number;
  unverified: number;
  byRole: Record<UserRole, number>;
}

export type UserSortField = 'name' | 'email' | 'role' | 'createdAt' | 'updatedAt' | 'isVerified';

// ============================================================================
// BUSINESS TYPES
// ============================================================================

export interface Business {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  ownerId: string;
  owner?: User;
  outlets?: Outlet[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessDto {
  name: string;
  description?: string;
  logo?: string;
}

export interface UpdateBusinessDto {
  name?: string;
  description?: string;
  logo?: string;
}

// ============================================================================
// OUTLET TYPES
// ============================================================================

export interface Outlet {
  id: string;
  name: string;
  description?: string | null;
  address: string | null;
  phone?: string | null;
  image?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isOpen?: boolean;
  manualBankName?: string | null;
  manualBankAccount?: string | null;
  manualAccountHolder?: string | null;
  manualPaymentNote?: string | null;
  manualQrImageUrl?: string | null;
  businessId: string;
  business?: Business;
  products?: Product[];
  createdAt: string;
  updatedAt: string;
  qrisImage?: string | null;
}

export interface CreateOutletDto {
  name: string;
  address?: string;
  phone?: string;
  businessId: string;
}

export interface UpdateOutletDto {
  name?: string;
  address?: string;
  phone?: string;
}

// ============================================================================
// PRODUCT TYPES
// ============================================================================

export enum ProductStatus {
  AVAILABLE = 'AVAILABLE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED'
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  image?: string;
  status: ProductStatus;
  outletId: string;
  outlet?: Outlet;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  stock: number;
  image?: string;
  status?: ProductStatus;
  outletId: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  image?: string;
  status?: ProductStatus;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  userId: string;
  user?: User;
  outletId: string;
  outlet?: Outlet;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface CreateOrderDto {
  outletId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  QRIS = 'QRIS',
  BANK_TRANSFER = 'BANK_TRANSFER',
  E_WALLET = 'E_WALLET'
}

export interface Transaction {
  id: string;
  transactionNumber: string;
  amount: number;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  orderId?: string;
  order?: Order;
  userId: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilters extends BaseQueryParams {
  status?: TransactionStatus | 'all';
  paymentMethod?: PaymentMethod | 'all';
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// EXPENSE TYPES
// ============================================================================

export enum ExpenseCategory {
  OPERATIONAL = 'OPERATIONAL',
  INVENTORY = 'INVENTORY',
  MARKETING = 'MARKETING',
  SALARY = 'SALARY',
  OTHER = 'OTHER'
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  outletId: string;
  outlet?: Outlet;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseDto {
  description: string;
  amount: number;
  category: ExpenseCategory;
  outletId: string;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueGrowth: number;
  ordersGrowth: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export type FormErrors<T = any> = {
  [K in keyof T]?: string;
};

export interface FormState<T = any> {
  data: T;
  errors: FormErrors<T>;
  isSubmitting: boolean;
  isDirty: boolean;
}

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface TableColumn<T = any> {
  key: keyof T | string;
  title: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface TableAction<T = any> {
  label: string;
  onClick: (record: T) => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'primary' | 'secondary';
  disabled?: boolean | ((record: T) => boolean);
  hidden?: boolean | ((record: T) => boolean);
}

export interface TableBulkAction<T = any> {
  label: string;
  onClick: (records: T[]) => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive';
  confirmMessage?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ID = string | number;

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Re-export specific types from other files for backward compatibility
export type { PaginationResponse } from './api.type';
export type {
  UserFormData,
  UserFormErrors,
  UserRowAction,
  UserBulkAction
} from './user';
