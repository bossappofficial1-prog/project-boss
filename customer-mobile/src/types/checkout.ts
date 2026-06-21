import type { CartItem } from "@/features/cart";
import type { PaymentMethod } from "@/types/payment";

export interface OutletSummary {
  outletId: string;
  outletName: string;
  subtotal: number;
  items: CartItem[];
}

export interface CheckoutData {
  outlets: OutletSummary[];
  subtotal: number;
  tax: number;
  taxName?: string | null;
  grandTotal: number;
}

export interface CreatePaymentPayload {
  outletId: string;
  guestCustomer: {
    name: string;
    phone: string;
  };
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  paymentMethod: "online";
  onlinePaymentChannel: string;
  bookingSlotId?: string;
  staffId?: string;
  tableId?: string;
  tableNumber?: string;
}

export interface CreatePaymentResponse {
  order_id: string;
  transaction_id?: string;
  transaction_status?: string;
  gross_amount?: number;
  expiry_time?: string;
  redirect_url?: string;
  qr_string?: string;
  va_number?: string;
  manual?: {
    type: string;
    instructions: any;
    fee_summary: {
      applicationFee: number;
      transactionFee: number;
      subtotal: number;
    };
  };
}
