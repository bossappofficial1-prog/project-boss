import type { Product as BackendProduct } from "@/lib/apis/order";

export type PaymentMethod = "cash" | "qris" | "online";

export type POSCustomerMode = "identified" | "walkin";

// POSProduct now properly extends Product which has the correct structure
export interface POSProduct extends BackendProduct {
  // All fields are inherited from Product interface
  // which now properly includes goods and service subtypes
}

export interface POSCartLine {
  product: POSProduct;
  quantity: number;
  bookingSlotId?: string;
  bookingStart?: string;
  bookingEnd?: string;
}
