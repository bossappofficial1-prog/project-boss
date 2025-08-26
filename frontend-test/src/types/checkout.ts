// Checkout related types
export interface OutletSummary {
    outletName: string;
    subtotal: number;
    transactionFee: number;
    applicationFee: number;
}

export interface CheckoutData {
    outlets: OutletSummary[];
    subtotal: number;        // Total subtotal semua outlet
    totalTransactionFee: number;  // Total biaya transaksi
    applicationFee: number;  // Biaya aplikasi
    grandTotal: number;      // Total keseluruhan
    selectedPaymentMethod?: PaymentMethod; // Untuk flow ke payment
}

export interface CheckoutProps {
    outlets: OutletSummary[];
    subtotal: number;
    totalTransactionFee: number;
    applicationFee: number;
    grandTotal: number;
}

// Payment form data untuk halaman payment
export interface PaymentFormData {
    customerName: string;
    phoneNumber: string;
    paymentMethod: PaymentMethod;
    checkoutData: CheckoutData;
}

export interface PaymentMethod {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    type: 'qris' | 'va' | 'credit';
}

export type PaymentMethodType = 'qris' | 'va' | 'credit';

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
