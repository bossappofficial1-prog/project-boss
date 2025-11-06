import { $Enums } from "@prisma/client";

export type UserMe = {
    name: string;
    id: string;
    email: string;
    avatar: string | null;
    password: string;
    role: $Enums.UserRole;
    isVerified: boolean;
    verificationCode: string | null;
    verificationCodeExpires: Date | null;
    phone: string | null;
    createdAt: Date;
    updatedAt: Date;
    business: {
        id: string,
        name: string,
        description: string,
        outlets: Outlet[]
    }
}

export type Outlet = {
    id: string;
    name: string;
    businessId: string
}

export type MidtransWebhookPayloadType = {
    transaction_type: string //'off-us'
    transaction_time: string //'2025-08-29 14:31:10'
    transaction_status: string// 'pending',
    transaction_id: string//'8518f522-aac1-4513-83b1-36069db46ae9'
    status_message: string//'midtrans payment notification'
    status_code: string//'201',
    signature_key: string// 'c7a7613d9439f84eb8dac5364cc3cc4dad1cc9e883d59ccbe40770b0f1ff201c5cd846d6905b5410aa9e028379756def75190e548e8296badc1b2c5b008ccd85',
    payment_type: string// 'qris',
    order_id: string//'ORD2025082914318013',
    merchant_id: string// 'G036133647',
    gross_amount: string//'15750.00',
    fraud_status: string//'accept',
    expiry_time: string//'2025-08-29 14:46:09',
    currency: string// 'IDR'
}

export interface MidtransItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

export interface MidtransPayload {
    transaction_details: {
        order_id: string;
        gross_amount: number;
    };
    customer_details: {
        first_name: string;
        phone: string;
    };
    item_details: MidtransItem[];
    payment_type: string;
    bank_transfer?: {
        bank: string
    };
    gopay?: {
        enable_callback?: boolean;
        callback_url?: string;
    };
    qris?: Record<string, unknown>;
}


export interface PaymentResponse {
    status_code?: string
    status_message?: string
    transaction_id: string
    order_id: string
    merchant_id?: string
    gross_amount: number
    currency?: string
    payment_type: string
    transaction_time: Date
    payment_amounts?: { paid_at: string, amount: string }[]
    transaction_status: MidtransTransactionStatus
    fraud_status?: string
    actions?: Action[]
    acquirer?: string
    qr_string?: string
    expiry_time: Date
    va_numbers?: VaNumber[]
    transaction_type?: string //'off-us'
    pdf_url?: string
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
    name: string,
    phone: string
}

export interface Action {
    name: string
    method: string
    url: string
}

export interface VaNumber {
    bank: string
    va_number: string
}

type PaymentStatus = "PENDING"
    | "PROOF_SUBMITTED"
    | "AWAITING_VERIFICATION"
    | "SUCCESS"
    | "FAILED"
    | "REFUNDED"
    | "EXPIRED"
    | "CANCELLED"
    | "REJECTED_MANUAL"

export interface TransactionDetail {
    id: string;
    status: PaymentStatus;
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    payment: {
        status: PaymentStatus,
        method: string,
        isManual: boolean,
        midtrans: {
            transaction_id: string,
            order_id: string,
            gross_amount: number,
            transaction_status: string,
            payment_type: string,
            qr_string: string,
            expiry_time: Date,
        },

    },
    customer: {
        name: string,
        phone: string
    },
    items: [
        {
            id: string,
            name: string,
            price: number,
            quantity: number,
            subtotal: number
        }
    ]
}
