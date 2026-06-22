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
  goods?: Goods;
  service?: Service;
  ticket?: Ticket;
  media?: ProductMedia[];
}

export interface ProductDetail extends OutletProduct {
  category?: {
    id: string;
    name: string;
  } | null;
  categoryId: string;
  image: string;
  taxPercentage: number;
  taxName: string;
}

export interface ProductMedia {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  source?: "UPLOAD" | "EMBED";
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

export interface Goods {
  id: string;
  productId: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  averageHpp: number;
  sellingPrice: number;
  createdAt: string;
  sku?: string;
  updatedAt: string;
}

export interface Media {
  id: string;
  url: string;
  type: string;
  source: string;
  order: number;
  thumbnailUrl?: string;
}

export interface Ticket {
  id: string;
  productId: string;
  sellingPrice: number;
  eventDate: string;
  eventEndDate: string;
  venue: string;
  venueAddress: string;
  mapUrl?: string;
  totalQuota: number;
  soldCount: number;
  maxPerOrder: number;
  saleStartDate: string;
  saleEndDate: string;
  terms: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  productId: string;
  durationMinutes: number;
  sellingPrice: number;
  bookingInWorkHours: boolean;
  providerName: string;
  providerPhone: string;
  providerEmail: string;
}
