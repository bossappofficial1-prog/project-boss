export type OrderStatusType =
  | "AWAITING_PAYMENT"
  | "PROCESSING"
  | "CONFIRMED"
  | "READY"
  | "ON_GOING"
  | "COMPLETED"
  | "CANCELLED";

export const OrderStatus: Record<OrderStatusType, OrderStatusType> = {
  AWAITING_PAYMENT: "AWAITING_PAYMENT",
  PROCESSING: "PROCESSING",
  CONFIRMED: "CONFIRMED",
  READY: "READY",
  ON_GOING: "ON_GOING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

export type PaymentStatusType =
  | "PENDING"
  | "PROOF_SUBMITTED"
  | "AWAITING_VERIFICATION"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED"
  | "EXPIRED"
  | "CANCELLED"
  | "REJECTED_MANUAL";

export const PaymentStatus: Record<PaymentStatusType, PaymentStatusType> = {
  PENDING: "PENDING",
  PROOF_SUBMITTED: "PROOF_SUBMITTED",
  AWAITING_VERIFICATION: "AWAITING_VERIFICATION",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
  REJECTED_MANUAL: "REJECTED_MANUAL",
};

export interface OrderItem {
  id: string;
  priceAtTimeOfOrder: number;
  quantity: number;
  product: {
    id: string;
    name: string;
    type: "GOODS" | "SERVICE" | "TICKET";
    image?: string;
  };
  ticketCodes?: Array<{
    id: string;
    code: string;
    status: "VALID" | "REDEEMED" | "CANCELLED" | "EXPIRED";
  }>;
}

export interface OrderDetail {
  id: string;
  totalAmount: number;
  bookingDate: string | null;
  customerType: string;
  paymentStatus: PaymentStatusType;
  paymentReminderSent: boolean;
  orderStatus: OrderStatusType;
  midtransFee: number;
  appFee: number;
  taxAmount?: number;
  outletId: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  outlet: {
    id: string;
    slug?: string;
    name: string;
    phone: string;
    address: string;
  };
  transaction: {
    id: string;
    paymentMethod: string;
    status: string;
    expiryTime?: string;
    rejectionNote?: string | null;
  } | null;
  customerDetails: {
    id: string;
    name: string;
    phone: string;
  };
  bookingSlot?: {
    id: string;
    date: string | null;
    startTime: string | null;
    endTime: string | null;
    status: string;
    productId: string;
  } | null;
  queueMeta?: {
    position: number;
    totalAhead: number;
    totalOrders: number;
    scheduledStart: string | null;
    scheduledEnd: string | null;
    status: OrderStatusType;
  } | null;
  cancellationReason?: string | null;
}
