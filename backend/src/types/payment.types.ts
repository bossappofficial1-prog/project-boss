export enum PaymentStatus {
    PENDING = 'pending',
    SUCCESS = 'success',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
    EXPIRED = 'expired'
}

export enum PaymentMethod {
    CREDIT_CARD = 'credit_card',
    BANK_TRANSFER = 'bank_transfer',
    E_WALLET = 'e_wallet',
    VIRTUAL_ACCOUNT = 'virtual_account',
    QRIS = "qris"
}

export interface PaymentRequest {
    amount: number;
    currency: string;
    payment_method: PaymentMethod;
    customer_details: CustomerDetails;
    item_details: ItemDetails[];
    callback_url?: string;
}

export interface CustomerDetails {
    first_name: string;
    last_name: string;
    email: string;
}

export interface ItemDetails {
    id: string;
    price: number;
    quantity: number;
    name: string;
    brand?: string;
    category?: string;
    merchant_name?: string;
}

export interface Address {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    country_code: string;
}

export interface PaymentResponse {
    transaction_id: string;
    payment_url?: string;
    va_number?: string;
    status: PaymentStatus;
    amount: number;
    currency: string;
    created_at: Date;
    expired_at?: Date;
}