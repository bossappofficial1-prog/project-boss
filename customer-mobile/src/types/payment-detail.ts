export interface PaymentDetailData {
  id: string;
  status: string;
  totalAmount: number;
  taxAmount?: number;
  taxName?: string | null;
  outletInfo?: {
    name: string;
    isWithinOperatingHours: boolean;
    todaySchedule: {
      isOpen: boolean;
      openTime: string;
      closeTime: string;
    } | null;
  };
  payment: {
    status: string;
    method: string;
    isManual: boolean;
    midtrans?: {
      transaction_id: string;
      order_id: string;
      gross_amount: string;
      transaction_status: string;
      payment_type: string;
      expiry_time?: string;
      actions?: Array<{ name: string; method: string; url: string }> | null;
      va_numbers?: Array<{ bank: string; va_number: string }> | null;
      [key: string]: unknown;
    } | null;
    manual?: {
      type?: string;
      instructions?: {
        manualType?: string;
        outletName?: string;
        businessName?: string;
        note?: string | null;
        qrImageUrl?: string | null;
        qrisString?: string | null;
        bankAccount?: {
          bankName?: string;
          accountNumber?: string;
          accountHolder?: string;
        } | null;
        expiry_time?: string;
      };
      intruction?: {
        manualType?: string;
        outletName?: string;
        businessName?: string;
        note?: string | null;
        qrImageUrl?: string | null;
        qrisString?: string | null;
        bankAccount?: {
          bankName?: string;
          accountNumber?: string;
          accountHolder?: string;
        } | null;
        expiry_time?: string;
      };
      paymentProofUrl?: string | null;
    } | null;
  };
  customerDetails: {
    name: string;
    phone: string;
  };
  feeDetail: {
    appFee: number;
    transactionFee: number;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    subtotal?: number;
    taxPercentage?: number | null;
    taxName?: string | null;
  }>;
}
