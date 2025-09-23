// Shared types for the Dashboard domain

export interface DashboardStats {
  totalProducts: number;
  totalServices: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface Business {
  id: string;
  name: string;
  description?: string;
  type?: string;
  address?: string;
  phone?: string;
  bankName?: string;
  bankAccount?: string;
  accountHolder?: string;
  transactionFeeBearer?: string;
}

export interface Outlet {
  id: string;
  name: string;
  address: string;
  phone?: string;
  image?: string;
  latitude?: number;
  longitude?: number;
}

export interface Business {
  id: string;
  name: string;
  description?: string;
  type?: string;
  address?: string;
  phone?: string;
  bankName?: string;
  bankAccount?: string;
  accountHolder?: string;
  transactionFeeBearer?: string;
}

export interface OutletDetail extends Outlet {
  createdAt: string;
  updatedAt: string;
  businessId: string;
  business: Business;
  operatingHours: OperatingHours[];
  isOpen: boolean;
  image?: string; // Note: API uses 'image' instead of 'imageUrl'
  description?: string;
}

export interface OperatingHours {
  id: string;
  dayOfWeek: number;
  openTime: string; // ISO string from backend (e.g., "1970-01-01T02:00:00.000Z")
  closeTime: string; // ISO string from backend (e.g., "1970-01-01T10:00:00.000Z")
  isOpen: boolean;
  outletId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OperatingHoursFormData {
  id?: string;
  outletId: string;
  dayOfWeek: number;
  openTime: string; // HH:MM format for form (e.g., "02:00")
  closeTime: string; // HH:MM format for form (e.g., "10:00")
  isOpen: boolean;
}

export type OrderStatsMap = Record<string, { totalOrders: number; totalRevenue: number }>;
