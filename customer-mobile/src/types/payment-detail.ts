export interface PaymentDetailData {
  id: string;
  status: string;
  totalAmount: number;
  taxAmount?: number;
  taxName?: string | null;
  outletInfo: OutletInfo;
  payment: Payment;
  customerDetails: CustomerDetails;
  feeDetail: FeeDetail;
  items: Item[];
}

export interface Root {
  id: string;
  status: string;
  totalAmount: number;
  taxAmount: number;
  taxName: string;
  outletInfo: OutletInfo;
  payment: Payment;
  customerDetails: CustomerDetails;
  feeDetail: FeeDetail;
  items: Item[];
}

export interface OutletInfo {
  name: string;
  isWithinOperatingHours: boolean;
  todaySchedule: TodaySchedule;
  operatingHours: OperatingHour[];
}

export interface TodaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface OperatingHour {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface Payment {
  status: string;
  method: string;
  isManual: boolean;
  midtrans: Midtrans;
  manual: Manual;
}

export interface Manual {
  type: string;
  paymentProofUrl: any;
  intruction: Intruction;
}

export interface Intruction {
  manualType?: string;
  outletName?: string;
  businessName?: string;
  note?: string | null;
  qrImageUrl?: string | null;
  qrisString?: string | null;
  bankAccount?: BankAccount;
  expiry_time?: string;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface CustomerDetails {
  name: string;
  phone: string;
}

export interface FeeDetail {
  appFee: number;
  transactionFee: number;
}

export interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal?: number;
  taxPercentage?: number | null;
  taxName?: string | null;
}

export interface Midtrans {
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  transaction_status: string;
  payment_type: string;
  expiry_time?: string;
  actions?: Array<{ name: string; method: string; url: string }> | null;
  va_numbers?: Array<{ bank: string; va_number: string }> | null;
  [key: string]: unknown;
}
