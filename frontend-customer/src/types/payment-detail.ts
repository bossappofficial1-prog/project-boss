export interface PaymentDetailApiResponse {
    success: boolean;
    message: string;
    data: PaymentDetailData;
    timestamp?: string;
    path?: string;
}

export interface PaymentDetailData {
    id: string;
    status: string;
    totalAmount: number;
    payment: PaymentDetailPayment;
    customerDetails: PaymentDetailCustomer;
    feeDetail: PaymentDetailFeeDetail;
    items: PaymentDetailItem[];
}

export interface PaymentDetailCustomer {
    name: string;
    phone: string;
}

export interface PaymentDetailFeeDetail {
    appFee: number;
    transactionFee: number;
}

export interface PaymentDetailItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    subtotal?: number;
}

export interface PaymentDetailPayment {
    status: string;
    method: string;
    isManual: boolean;
    midtrans?: PaymentDetailMidtrans | null;
    manual?: PaymentDetailManual | null;
}

export interface PaymentDetailMidtrans {
    transaction_id: string;
    order_id: string;
    gross_amount: string;
    transaction_status: string;
    payment_type: string;
    expiry_time?: string;
    actions?: Array<{ name: string; method: string; url: string }> | null;
    va_numbers?: Array<{ bank: string; va_number: string }> | null;
    currency?: string;
    [key: string]: unknown;
}

export interface PaymentDetailManual {
    type?: string;
    instructions?: PaymentManualInstruction;
    intruction?: PaymentManualInstruction; // Some APIs use a misspelled key
    paymentProofUrl?: string | null;
}

export interface PaymentManualInstruction {
    manualType?: string;
    outletName?: string;
    businessName?: string;
    note?: string | null;
    qrImageUrl?: string | null;
    bankAccount?: PaymentManualBankAccount | null;
    expiry_time?: string;
    [key: string]: unknown;
}

export interface PaymentManualBankAccount {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
}
