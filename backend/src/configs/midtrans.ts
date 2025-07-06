import crypto from 'crypto'
import { config } from "./config";
import { AppError } from '../errors/api_errors';
import MidtransClient, { CoreApi, CoreApiChargeRequest, RefundRequest, Snap, SnapTransactionRequest, SnapTransactionResponse, TransactionStatusResponse } from 'midtrans-client';

export const midtransConfig = {
    isProduction: config.NODE_ENV === "production",
    serverKey: config.midtrans.MIDTRANS_SERVER_KEY,
    clientKey: config.midtrans.MIDTRANS_CLIENT_KEY,
    merchantId: config.midtrans.MIDTRANS_MERCHANT_ID,
    expiry: {
        unit: (process.env.MIDTRANS_EXPIRE_UNIT || "minute") as "minute" | "second" | "hour" | "day",
        duration: parseInt(process.env.MIDTRANS_EXPIRE_DURATION || "10", 10)
    },
} as const

export const MIDTRANS_API = {
    sandbox: 'https://api.sandbox.midtrans.com/v2',
    production: 'https://api.midtrans.com/v2'
} as const

export const PAYMENT_TYPES = {
    QRIS: 'qris',
    E_WALLET: 'e_wallet',
    BANK_TRANSFER: 'bank_transfer'
} as const

export const FEES = {
    QRIS: 0.01,
    TRANSACTION: 0.02,
    WITHDRAWAL: {
        FIXED: 4000,
        PRECENTAGE: 0.02
    }
} as const

export const FEE_CHARGED_TO = {
    CUSTOMER: 'customer',
    OWNER: 'owner'
} as const

export const BANK_CODES = {
    BCA: 'bca',
    BNI: 'bni',
    BRI: 'bri',
    MANDIRI: 'mandiri',
    PERMATA: 'permata'
} as const

export const EWALLET_TYPES = {
    GOPAY: 'gopay',
    SHOPEEPAY: 'shopeepay',
    DANA: 'dana',
    OVO: 'ovo'
} as const


export function validateMidtransSignature(body: any) {
    const { order_id, status_code, gross_amount, signature_key } = body;

    const serverKey = config.midtrans.MIDTRANS_SERVER_KEY;
    const input = order_id + status_code + gross_amount + serverKey;

    const hash = crypto.createHash('sha512').update(input).digest('hex');

    if (hash !== signature_key) {
        throw new AppError("Invalid signature from Midtrans", 400);
    }

    return true
}

export class Midtrans {
    private snap: Snap;
    private core: CoreApi;

    constructor() {
        this.snap = new (MidtransClient).Snap({
            isProduction: midtransConfig.isProduction,
            serverKey: midtransConfig.serverKey!,
            clientKey: midtransConfig.clientKey,
        });
        this.core = new (MidtransClient).CoreApi({
            isProduction: midtransConfig.isProduction,
            serverKey: midtransConfig.serverKey!,
            clientKey: midtransConfig.clientKey,
        });
    }

    public async createTransactionSnap(parameter: SnapTransactionRequest): Promise<SnapTransactionResponse> {
        try {
            const transaction = await this.snap.createTransaction(parameter);
            return transaction;
        } catch (error) {
            throw new AppError("Failed to create Midtrans transaction", 500);
        }
    }

    public async createTransactionCore(params: CoreApiChargeRequest): Promise<TransactionStatusResponse> {
        try {
            const transaction = await this.core.charge(params);
            return transaction;
        } catch (error) {
            throw new AppError("Failed to create Midtrans transaction", 500);
        }
    }

    public async refundTransaction(orderId: string, params: RefundRequest): Promise<TransactionStatusResponse> {
        try {
            const refundParams: any = {};
            if (params.amount) refundParams.amount = params.amount;
            if (params.reason) refundParams.reason = params.reason;
            const response = await this.core.transaction.refund(orderId, refundParams);
            return response;
        } catch (error) {
            throw new AppError("Failed to refund Midtrans transaction", 500);
        }
    }

    public async getTransactionStatus(orderId: string): Promise<any> {
        try {
            const status = await this.core.transaction.status(orderId);
            return status;
        } catch (error) {
            throw new AppError("Failed to get Midtrans transaction status", 500);
        }
    }

    public async cancelTransaction(orderId: string): Promise<any> {
        try {
            const response = await this.core.transaction.cancel(orderId);
            return response;
        } catch (error) {
            throw new AppError("Failed to cancel Midtrans transaction", 500);
        }
    }

}