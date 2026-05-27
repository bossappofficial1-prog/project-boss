// Shared types for the Dashboard domain

import { OutletType } from ".";

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
  instagramUrl?: string;
  email?: string;
  image?: string;
  latitude?: number;
  longitude?: number;
  qrisImage?: string | null;
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
  type: OutletType;
  description?: string;
}

export interface OperatingHours {
  id: string;
  dayOfWeek: number;
  openTime: string; // ISO string from backend (e.g., "1970-01-01T02:00:00.000Z")
  closeTime: string; // ISO string from backend (e.g., "1970-01-01T10:00:00.000Z")
  breakStart?: string | null; // ISO string from backend
  breakEnd?: string | null; // ISO string from backend
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
  breakStart?: string | null; // HH:MM format for form or null
  breakEnd?: string | null; // HH:MM format for form or null
  isOpen: boolean;
}

export type OrderStatsMap = Record<string, { totalOrders: number; totalRevenue: number }>;
