// Checkout related types
import { CartItem } from '@/hooks/useCart';
import type { PaymentMethod as GlobalPaymentMethod } from '.';

export interface OutletSummary {
    outletName: string;
    outletId: string;
    subtotal: number;
    items: CartItem[];
}

export interface CheckoutData {
    outlets: OutletSummary[];
    subtotal: number;
    tax: number;
    grandTotal: number;
    selectedPaymentMethod?: PaymentMethod;
}

export interface CheckoutProps {
    outlets: OutletSummary[];
    subtotal: number;
    tax?: number;
    totalTransactionFee?: number;
    applicationFee?: number;
    grandTotal: number;
}

// Payment form data untuk halaman payment
export interface PaymentFormData {
    customerName: string;
    phoneNumber: string;
    paymentMethod: PaymentMethod;
    checkoutData: CheckoutData;
}

export type PaymentMethod = GlobalPaymentMethod;

export type PaymentMethodType = PaymentMethod['type'];

// Payment flow states
export interface PaymentFlowState {
    selectedMethod: PaymentMethod | null;
    isProcessing: boolean;
    error?: string;
}

// Virtual Account specific
export interface VirtualAccountInfo {
    bankCode: string;
    accountNumber: string;
    amount: number;
    expiryTime: Date;
}

// QRIS specific
export interface QRISInfo {
    qrString: string;
    amount: number;
    expiryTime: Date;
}
