export interface ProductMediaItem {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  source: "UPLOAD" | "EMBED";
  alt?: string;
  order: number;
  thumbnailUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  description?: string;
  image: string;
  type: "GOODS" | "SERVICE" | "TICKET";
  taxPercentage?: number | null;
  outletId: string;
  media?: ProductMediaItem[];
  createdAt: string;
  updatedAt: string;
  goods?: Goods;
  service?: Service;
  ticket?: Ticket;
}

export interface Goods {
  id: string;
  productId: string;
  currentStock: number;
  minStock: number | null;
  unit: string;
  averageHpp: number;
  sellingPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  productId: string;
  durationMinutes: number;
  sellingPrice: number;
  providerName: string;
  providerPhone: string;
  providerEmail: string;
  commissionType: "PERCENTAGE" | "FIXED";
  commissionValue: number;
  maxParallel: number;
  bookingInWorkHours?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  productId: string;
  sellingPrice: number;
  eventDate: string;
  eventEndDate?: string | null;
  venue: string;
  venueAddress?: string | null;
  mapUrl?: string | null;
  totalQuota: number;
  soldCount: number;
  maxPerOrder: number;
  saleStartDate?: string | null;
  saleEndDate?: string | null;
  terms?: string | null;
  createdAt: string;
  updatedAt: string;
}
