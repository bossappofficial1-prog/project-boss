import crypto from 'crypto'
import { config } from "./config";
import { AppError } from '../errors/api_errors';

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

