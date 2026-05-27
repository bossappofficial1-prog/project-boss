import { Product } from "./product";
export * from "./outlet";
export * from "./home";

export interface OutletType {
  id: string;
  name: string;
  /** Backend enum: FNB | RETAIL | EVENT | SERVICE | CUSTOM */
  type: "FNB" | "RETAIL" | "EVENT" | "SERVICE" | "CUSTOM";
  slug?: string;
  address: string;
  phone: string;
  instagramUrl?: string;
  email?: string;
  createdAt: string;
  image: string;
  updatedAt: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  status: boolean;
  businessId: string;
  operatingHours: OperatingHourType[];
  business: Pick<BusinessType, "id" | "name" | "defaultTransactionFeeBearer">;
}

export interface PaymentTimer {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface BusinessType {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  ownerId: string;
  defaultTransactionFeeBearer: string;
}

export interface OperatingHourType {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
  isOpen: boolean;
}

// Re-export Product types from product.ts as single source of truth
export type { Product as ProductType, Goods, Service } from "./product";

export interface NearbyOutletsParams {
  latitude?: number;
  longitude?: number;
  radius?: number;
  limit?: number;
  take?: number;
  skip?: number;
  search?: string;
}

export interface BookingSlotType {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingSlotStatus;
  productId: string;
  orderId: string;
  staffId: string;
  createdAt: string;
  updatedAt: string;
}

export type BookingSlotStatus = "AVAILABLE" | "BOOKED" | "BLOCKED";

export interface PaymentData {
  outlet: {
    name: string;
    id: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  transactionFee?: number;
  applicationFee: number;
  total: number;
  paymentMethod: {
    type: string;
    name: string;
    category: string;
  };
  customerInfo: {
    name: string;
    phone: string;
  };
  orderId: string;
  pendingSince?: string;
  bankReference?: string;
  estimatedProcessing?: string;
  cancelledAt?: string;
  cancelReason?: string;
  failureReason?: string;
  timestamp?: string;
  expiredAt?: string;
  paymentStarted?: string;
  timeLimit?: number;
}

export type PaymentMethodId =
  | "qris"
  | "bca-va"
  | "bni-va"
  | "bri-va"
  | "mandiri-va"
  | "permata-va"
  | "manual-qris"
  | "manual-transfer";

export type PaymentMethodType = "qris" | "va" | "manual";

export type ManualPaymentTypeLiteral = "QRIS_OFFLINE" | "OWNER_TRANSFER";

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  type: PaymentMethodType;
  description: string;
  image_url: string;
  flow?: "midtrans" | "manual";
  manualType?: ManualPaymentTypeLiteral;
  disable: boolean;
}

export interface ManualPaymentFeeSummary {
  applicationFee: number;
  transactionFee: number;
  subtotal: number;
}

export interface ManualPaymentInstructions {
  manualType: ManualPaymentTypeLiteral;
  outletName: string;
  businessName: string;
  qrImageUrl?: string;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  note?: string | null;
}

export interface ManualPaymentResponse {
  order_id: string;
  transaction_id: string;
  transaction_status: string;
  gross_amount: number;
  expiry_time: string;
  manual: {
    type: ManualPaymentTypeLiteral;
    instructions: ManualPaymentInstructions;
    fee_summary: ManualPaymentFeeSummary;
  };
  customer_details: {
    name: string;
    phone: string;
  };
}

export interface PaymentResponse {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  currency: string;
  payment_type: string;
  transaction_time: string;
  payment_amounts: { paid_at: string; amount: string }[];
  transaction_status: MidtransTransactionStatus;
  fraud_status: string;
  actions?: Action[];
  acquirer?: string;
  qr_string?: string;
  expiry_time: string;
  va_numbers?: VaNumber[];
  transaction_type?: string; //'off-us'
  pdf_url?: string;
}

export type MidtransTransactionStatus =
  | "capture"
  | "settlement"
  | "pending"
  | "deny"
  | "cancel"
  | "expire"
  | "failure";

export interface CustomerInfo {
  name: string;
  phone: string;
}

export interface Action {
  name: string;
  method: string;
  url: string;
}

export interface VaNumber {
  bank: string;
  va_number: string;
}

export const OrderStatus = {
  AWAITING_PAYMENT: "AWAITING_PAYMENT", // Menunggu pembayaran dikonfirmasi
  PROCESSING: "PROCESSING", // Pesanan sedang diproses (bisa masuk antrian Redis/RabbitMQ)
  CONFIRMED: "CONFIRMED", // Merchant confirmed, order dijadwalkan
  READY: "READY", // Siap diambil (goods) atau siap dimulai (service)
  ON_GOING: "ON_GOING", // Service sedang berlangsung (service only)
  COMPLETED: "COMPLETED", // Pesanan selesai
  CANCELLED: "CANCELLED", // Pesanan dibatalkan
} as const;

export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus];

export interface OrderDetail {
  id: string;
  totalAmount: number;
  bookingDate: string | null;
  customerType: string;
  paymentStatus: string;
  paymentReminderSent: boolean;
  orderStatus: OrderStatusType;
  midtransFee: number;
  appFee: number;
  taxAmount?: number;
  outletId: string;
  createdAt: string;
  updatedAt: string;
  items: Item[];
  outlet: Pick<OutletType, "id" | "slug" | "name" | "phone" | "address">;
  transaction: Transaction | null;
  customerDetails: CustomerInfo & { id: string };
  bookingSlot?: OrderBookingSlot | null;
  queueMeta?: OrderQueueMeta | null;
  cancellationReason?: string | null;
}

export interface Item {
  id: string;
  priceAtTimeOfOrder: number;
  quantity: number;
  product: Product;
  ticketCodes?: TicketCode[];
}

export interface TicketCode {
  id: string;
  code: string;
  status: "VALID" | "REDEEMED" | "CANCELLED" | "EXPIRED";
  redeemedAt: string | null;
}

export interface OrderQueueMeta {
  position: number;
  totalAhead: number;
  totalOrders: number;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  status: OrderStatusType;
}

export interface OrderBookingSlot {
  id: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  status: BookingSlotStatus;
  productId: string;
  staffId?: string | null;
}

export interface Transaction {
  id: string;
  paymentMethod: string;
  status: TransactionStatus;
  expiryTime?: string; // ISO date string for payment expiry
  rejectionNote?: string | null;
}

export type TransactionStatus = "PENDING" | "PROOF_SUBMITTED" | "AWAITING_VERIFICATION" | "SUCCESS" | "FAILED" | "REFUNDED" | "EXPIRED" | "CANCELLED" | "REJECTED_MANUAL";