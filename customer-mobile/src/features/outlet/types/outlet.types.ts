export interface OperatingHour {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
  isOpen: boolean;
}

export interface OutletDetail {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  instagramUrl?: string | null;
  email?: string | null;
  image?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isOpen: boolean;
  isBreak?: boolean | null;
  type: "FNB" | "RETAIL" | "EVENT" | "SERVICE" | "CUSTOM";
  business?: {
    id: string;
    name: string;
    description?: string | null;
  };
  operatingHours: OperatingHour[];
}

export interface OutletProduct {
  id: string;
  name: string;
  description?: string | null;
  type: "GOODS" | "SERVICE" | "TICKET";
  status: string;
  image?: string | null;
  outletId: string;
  taxPercentage?: number;
  taxName?: string;
  goods?: {
    sellingPrice: number;
    currentStock: number;
    unit?: string;
    barcode?: string;
    sku?: string;
  } | null;
  service?: {
    sellingPrice: number;
    durationMinutes?: number;
    bookingSlots?: BookingSlot[];
  } | null;
  ticket?: {
    sellingPrice: number;
    eventDate?: string;
    eventEndDate?: string | null;
    venue: string;
    venueAddress?: string | null;
    mapUrl?: string | null;
    totalQuota?: number;
    soldCount?: number;
    maxPerOrder?: number;
    saleStartDate?: string | null;
    saleEndDate?: string | null;
    terms?: string | null;
  } | null;
  media?: ProductMedia[];
}

export interface ProductDetail extends OutletProduct {
  category?: {
    id: string;
    name: string;
  } | null;
  goods?: {
    sellingPrice: number;
    currentStock: number;
    unit?: string;
    barcode?: string;
    sku?: string;
  } | null;
  service?: {
    sellingPrice: number;
    durationMinutes?: number;
    bookingSlots?: BookingSlot[];
  } | null;
  ticket?: {
    sellingPrice: number;
    eventDate?: string;
    eventEndDate?: string | null;
    venue: string;
    venueAddress?: string | null;
    mapUrl?: string | null;
    totalQuota?: number;
    soldCount?: number;
    maxPerOrder?: number;
    saleStartDate?: string | null;
    saleEndDate?: string | null;
    terms?: string | null;
    capacity?: number;
  } | null;
}

export interface ProductMedia {
  id: string;
  url: string;
  type: "image" | "video";
  source?: string;
}

export interface BookingSlot {
  id: string;
  startTime: string;
  endTime: string;
  date: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED";
  staffId?: string | null;
  staffName?: string | null;
}

export interface OutletProductsResponse {
  data: OutletProduct[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
