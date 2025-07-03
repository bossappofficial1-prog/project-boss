declare module 'midtrans-client' {
    // ============================
    // COMMON INTERFACES
    // ============================
    interface MidtransConfig {
        isProduction: boolean;
        serverKey: string;
        clientKey?: string;
    }

    interface TransactionDetails {
        order_id: string;
        gross_amount: number;
    }

    interface CustomerDetails {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        billing_address?: Address;
        shipping_address?: Address;
    }

    interface Address {
        first_name?: string;
        last_name?: string;
        address?: string;
        city?: string;
        postal_code?: string;
        phone?: string;
        country_code?: string;
    }

    interface ItemDetails {
        id: string;
        name: string;
        price: number;
        quantity: number;
        brand?: string;
        category?: string;
        merchant_name?: string;
        url?: string;
    }

    interface CreditCard {
        token_id?: string;
        bank?: string;
        installment_term?: number;
        bins?: string[];
        type?: string;
        save_token_id?: boolean;
        authentication?: boolean;
        channel?: string;
        pre_auth?: boolean;
    }

    interface BankTransfer {
        bank: 'bca' | 'bni' | 'bri' | 'cimb' | 'permata';
        va_number?: string;
        free_text?: {
            inquiry?: Array<{ en: string; id: string }>;
            payment?: Array<{ en: string; id: string }>;
        };
    }

    interface Echannel {
        bill_info1?: string;
        bill_info2?: string;
        bill_info3?: string;
        bill_info4?: string;
        bill_info5?: string;
        bill_info6?: string;
        bill_info7?: string;
        bill_info8?: string;
    }

    interface Callbacks {
        finish?: string;
        error?: string;
        pending?: string;
        notification?: string
    }

    interface Expiry {
        start_time?: string;
        unit?: 'second' | 'minute' | 'hour' | 'day';
        duration?: number;
    }

    interface CustomField {
        [key: string]: any;
    }

    // ============================
    // SNAP INTERFACES
    // ============================
    interface SnapTransactionRequest {
        transaction_details: TransactionDetails;
        item_details?: ItemDetails[];
        customer_details?: CustomerDetails;
        enabled_payments?: string[];
        credit_card?: {
            secure?: boolean;
            bank?: string;
            installment?: {
                required?: boolean;
                terms?: {
                    [bank: string]: number[];
                };
            };
            whitelist_bins?: string[];
        };
        bca_va?: {
            va_number?: string;
            sub_company_code?: string;
            free_text?: {
                inquiry?: Array<{ en: string; id: string }>;
                payment?: Array<{ en: string; id: string }>;
            };
        };
        bni_va?: {
            va_number?: string;
        };
        bri_va?: {
            va_number?: string;
        };
        permata_va?: {
            va_number?: string;
            recipient_name?: string;
        };
        callbacks?: Callbacks;
        expiry?: Expiry;
        custom_field1?: string;
        custom_field2?: string;
        custom_field3?: string;
    }

    interface SnapTransactionResponse {
        token: string;
        redirect_url: string;
    }

    // ============================
    // CORE API INTERFACES
    // ============================
    interface CoreApiChargeRequest {
        payment_type: 'credit_card' | 'bank_transfer' | 'echannel' | 'gopay' | 'shopeepay' | 'qris' | 'dana' | 'linkaja' | 'ovo' | 'akulaku' | 'bca_klikpay' | 'bca_klikbca' | 'bri_epay' | 'telkomsel_cash' | 'indosat_dompetku' | 'xl_tunai' | 'mandiri_clickpay' | 'cimb_clicks' | 'danamon_online' | 'indomaret' | 'alfamart';
        transaction_details: TransactionDetails;
        credit_card?: CreditCard;
        bank_transfer?: BankTransfer;
        echannel?: Echannel;
        item_details?: ItemDetails[];
        customer_details?: CustomerDetails;
        custom_field1?: string;
        custom_field2?: string;
        custom_field3?: string;
        callbacks?: Callbacks;
        expiry?: Expiry;
        gopay?: {
            enable_callback?: boolean;
            callback_url?: string;
            account_id?: string;
            payment_option_token?: string;
            pre_auth?: boolean;
            recurring?: boolean;
        };
        shopeepay?: {
            callback_url?: string;
        };
        qris?: {
            acquirer?: string;
        };
    }

    interface TransactionStatusResponse {
        status_code: string;
        status_message: string;
        transaction_id: string;
        order_id: string;
        merchant_id: string;
        gross_amount: string;
        currency: string;
        payment_type: string;
        transaction_time: string;
        transaction_status: 'capture' | 'settlement' | 'pending' | 'deny' | 'cancel' | 'expire' | 'failure' | 'refund' | 'partial_refund' | 'authorize';
        fraud_status?: 'accept' | 'deny' | 'challenge';
        approval_code?: string;
        signature_key?: string;
        bank?: string;
        va_numbers?: Array<{
            bank: string;
            va_number: string;
        }>;
        payment_amounts?: Array<{
            paid_at: string;
            amount: string;
        }>;
        bill_key?: string;
        biller_code?: string;
        pdf_url?: string;
        finish_redirect_url?: string;
        actions?: Array<{
            name: string;
            method: string;
            url: string;
        }>;
        channel_response_code?: string;
        channel_response_message?: string;
        card_type?: string;
        masked_card?: string;
        saved_token_id?: string;
        saved_token_id_expired_at?: string;
        acquirer?: string;
        issuer?: string;
        eci?: string;
        refund_amount?: string;
        refunded_at?: string;
        custom_field1?: string;
        custom_field2?: string;
        custom_field3?: string;
    }

    interface CaptureRequest {
        transaction_id: string;
        gross_amount: number;
    }

    interface CardTokenRequest {
        card_number: string;
        card_exp_month: string;
        card_exp_year: string;
        card_cvv: string;
        client_key?: string;
    }

    interface CardTokenResponse {
        status_code: string;
        status_message: string;
        token_id: string;
        hash: string;
    }

    interface CardPointInquiryResponse {
        status_code: string;
        status_message: string;
        point_balance_amount: string;
    }

    interface RefundRequest {
        refund_key?: string;
        amount?: number;
        reason?: string;
    }

    // ============================
    // SUBSCRIPTION INTERFACES
    // ============================
    interface SubscriptionRequest {
        name: string;
        amount: number;
        currency: string;
        payment_type: string;
        token: string;
        schedule: {
            interval: number;
            interval_unit: 'day' | 'week' | 'month';
            max_interval?: number;
            start_time: string;
        };
        metadata?: Record<string, any>;
        customer_details?: CustomerDetails;
        item_details?: ItemDetails[];
    }

    interface SubscriptionResponse {
        id: string;
        name: string;
        amount: number;
        currency: string;
        created_at: string;
        schedule: {
            interval: number;
            interval_unit: string;
            max_interval: number;
            start_time: string;
        };
        status: 'active' | 'inactive';
        token: string;
        payment_type: string;
        metadata?: Record<string, any>;
        customer_details?: CustomerDetails;
        item_details?: ItemDetails[];
    }

    interface SubscriptionUpdateRequest {
        name?: string;
        amount?: number;
        currency?: string;
        token?: string;
        schedule?: {
            interval?: number;
            interval_unit?: 'day' | 'week' | 'month';
            max_interval?: number;
            start_time?: string;
        };
        metadata?: Record<string, any>;
        customer_details?: CustomerDetails;
        item_details?: ItemDetails[];
    }

    // ============================
    // IRIS INTERFACES (Disbursement)
    // ============================
    interface IrisConfig {
        isProduction: boolean;
        serverKey: string;
    }

    interface CreatePayoutRequest {
        payouts: Array<{
            beneficiary_name: string;
            beneficiary_account: string;
            beneficiary_bank: string;
            beneficiary_email?: string;
            amount: number;
            notes?: string;
        }>;
    }

    interface PayoutResponse {
        payouts: Array<{
            status: string;
            reference_no: string;
            beneficiary_name: string;
            beneficiary_account: string;
            beneficiary_bank: string;
            amount: number;
            notes?: string;
            created_by: string;
            created_at: string;
            updated_at: string;
        }>;
    }

    interface PayoutApprovalRequest {
        reference_nos: string[];
        otp: string;
    }

    interface PayoutDetailsResponse {
        status: string;
        reference_no: string;
        beneficiary_name: string;
        beneficiary_account: string;
        beneficiary_bank: string;
        amount: number;
        notes?: string;
        receipt: string;
        created_by: string;
        created_at: string;
        updated_at: string;
    }

    interface BankAccountValidationRequest {
        bank: string;
        account: string;
    }

    interface BankAccountValidationResponse {
        account_name: string;
        account_no: string;
    }

    interface BalanceResponse {
        balance: number;
    }

    interface FacilitatorBalanceResponse {
        balance: number;
    }

    interface BankListResponse {
        banks: Array<{
            code: string;
            name: string;
        }>;
    }

    // ============================
    // CLASSES
    // ============================
    class Snap {
        constructor(config: MidtransConfig);

        createTransaction(params: SnapTransactionRequest): Promise<SnapTransactionResponse>;

        transaction: {
            status(orderId: string): Promise<TransactionStatusResponse>;
            cancel(orderId: string): Promise<TransactionStatusResponse>;
            expire(orderId: string): Promise<TransactionStatusResponse>;
        };
    }

    class CoreApi {
        constructor(config: MidtransConfig);

        charge(params: CoreApiChargeRequest): Promise<TransactionStatusResponse>;

        capture(params: CaptureRequest): Promise<TransactionStatusResponse>;

        cardToken(params: CardTokenRequest): Promise<CardTokenResponse>;

        cardPointInquiry(tokenId: string): Promise<CardPointInquiryResponse>;

        transaction: {
            status(orderId: string): Promise<TransactionStatusResponse>;
            approve(orderId: string): Promise<TransactionStatusResponse>;
            cancel(orderId: string): Promise<TransactionStatusResponse>;
            expire(orderId: string): Promise<TransactionStatusResponse>;
            refund(orderId: string, params?: RefundRequest): Promise<TransactionStatusResponse>;
        };
    }

    class Subscription {
        constructor(config: MidtransConfig);

        createSubscription(params: SubscriptionRequest): Promise<SubscriptionResponse>;
        getSubscription(subscriptionId: string): Promise<SubscriptionResponse>;
        disableSubscription(subscriptionId: string): Promise<SubscriptionResponse>;
        enableSubscription(subscriptionId: string): Promise<SubscriptionResponse>;
        updateSubscription(subscriptionId: string, params: SubscriptionUpdateRequest): Promise<SubscriptionResponse>;
    }

    class Iris {
        constructor(config: IrisConfig);

        createPayouts(params: CreatePayoutRequest): Promise<PayoutResponse>;
        approvePayouts(params: PayoutApprovalRequest): Promise<PayoutResponse>;
        rejectPayouts(referenceNos: string[]): Promise<PayoutResponse>;
        getPayoutDetails(referenceNo: string): Promise<PayoutDetailsResponse>;
        getTransactionHistory(): Promise<PayoutResponse>;
        getTopUpHistory(): Promise<any>;
        validateBankAccount(params: BankAccountValidationRequest): Promise<BankAccountValidationResponse>;
        getBalance(): Promise<BalanceResponse>;
        getFacilitatorBalance(): Promise<FacilitatorBalanceResponse>;
        getFacilitatorBankAccounts(): Promise<any>;
        getBeneficiaryBanks(): Promise<BankListResponse>;
        ping(): Promise<string>;
    }

    // ============================
    // MAIN EXPORT
    // ============================
    export default class MidtransClient {
        static Snap: typeof Snap;
        static CoreApi: typeof CoreApi;
        static Subscription: typeof Subscription;
        static Iris: typeof Iris;
    }

    // Named exports
    export { Snap, CoreApi, Subscription, Iris };
    export type {
        MidtransConfig,
        TransactionDetails,
        CustomerDetails,
        Address,
        ItemDetails,
        CreditCard,
        BankTransfer,
        Echannel,
        Callbacks,
        Expiry,
        CustomField,
        SnapTransactionRequest,
        SnapTransactionResponse,
        CoreApiChargeRequest,
        TransactionStatusResponse,
        CaptureRequest,
        CardTokenRequest,
        CardTokenResponse,
        CardPointInquiryResponse,
        RefundRequest,
        SubscriptionRequest,
        SubscriptionResponse,
        SubscriptionUpdateRequest,
        IrisConfig,
        CreatePayoutRequest,
        PayoutResponse,
        PayoutApprovalRequest,
        PayoutDetailsResponse,
        BankAccountValidationRequest,
        BankAccountValidationResponse,
        BalanceResponse,
        FacilitatorBalanceResponse,
        BankListResponse
    };
}