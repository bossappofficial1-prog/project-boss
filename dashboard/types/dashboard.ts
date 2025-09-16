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
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
}

export type OrderStatsMap = Record<string, { totalOrders: number; totalRevenue: number }>;
