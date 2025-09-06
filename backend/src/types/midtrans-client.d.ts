declare module 'midtrans-client' {
    // Konfigurasi client
    export interface ClientConfig {
        isProduction: boolean;
        serverKey: string;
        clientKey: string;
    }

    export interface TransactionResponse {
        status_code: string;
        status_message: string;
        transaction_id: string;
        order_id: string;
        gross_amount: string;
        currency: string;
        payment_type: string;
        transaction_time: string;
        transaction_status:
        | 'authorize'
        | 'capture'
        | 'settlement'
        | 'pending'
        | 'deny'
        | 'cancel'
        | 'expire'
        | 'failure';
        fraud_status?: 'accept' | 'challenge' | 'deny';
        approval_code?: string;
        signature_key?: string;
        bank?: string;
        permata_va_number?: string;
        va_numbers?: Array<{ bank: string; va_number: string }>;
        payment_code?: string;
        store?: string;
        merchant_id?: string;
        [key: string]: any; // fallback untuk field lain
    }

    export interface RefundResponse {
        status_code: string;
        status_message: string;
        transaction_id: string;
        order_id: string;
        gross_amount: string;
        currency: string;
        refund_amount: string;
        refund_key: string;
        refund_chargeback_id?: string;
        refund_chargeback_time?: string;
        refund_chargeback_status?: string;
        transaction_status: string;
        [key: string]: any;
    }

    // --- Snap ---
    export class Snap {
        constructor(options: ClientConfig);

        createTransaction(parameter: any): Promise<TransactionResponse>;
        createTransactionToken(parameter: any): Promise<{ token: string }>;
        createTransactionRedirectUrl(parameter: any): Promise<{ redirect_url: string }>;

        transaction: {
            notification(notification: any): Promise<TransactionResponse>;
            status(transactionId: string | number): Promise<TransactionResponse>;
            statusb2b(transactionId: string | number): Promise<TransactionResponse>;
            approve(transactionId: string | number): Promise<TransactionResponse>;
            deny(transactionId: string | number): Promise<TransactionResponse>;
            cancel(transactionId: string | number): Promise<TransactionResponse>;
            expire(transactionId: string | number): Promise<TransactionResponse>;
            refund(transactionId: string | number, parameter?: any): Promise<RefundResponse>;
            capture(parameter: any): Promise<TransactionResponse>;
        };
    }

    // --- CoreApi ---
    export class CoreApi {
        constructor(options: ClientConfig);

        // Payment
        charge(parameter: any): Promise<TransactionResponse>;
        capture(parameter: any): Promise<TransactionResponse>;

        // Transaction Handling
        transaction: {
            status(transactionId: string | number): Promise<TransactionResponse>;
            statusb2b(transactionId: string | number): Promise<TransactionResponse>;
            approve(transactionId: string | number): Promise<TransactionResponse>;
            deny(transactionId: string | number): Promise<TransactionResponse>;
            cancel(transactionId: string | number): Promise<TransactionResponse>;
            expire(transactionId: string | number): Promise<TransactionResponse>;
            refund(transactionId: string | number, parameter?: any): Promise<RefundResponse>;
        };

        // Shortcut Methods
        status(transactionId: string | number): Promise<TransactionResponse>;
        statusb2b(transactionId: string | number): Promise<TransactionResponse>;
        approve(transactionId: string | number): Promise<TransactionResponse>;
        deny(transactionId: string | number): Promise<TransactionResponse>;
        cancelTransaction(transactionId: string | number): Promise<TransactionResponse>;
        expire(transactionId: string | number): Promise<TransactionResponse>;
        refund(transactionId: string | number, parameter?: any): Promise<RefundResponse>;
    }
}