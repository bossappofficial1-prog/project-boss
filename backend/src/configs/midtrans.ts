import { config } from "./config";

export const midtransConfig = {
    isProduction: config.NODE_ENV === "production",
    serverKey: config.midtrans.MIDTRANS_SERVER_KEY,
    clientKey: config.midtrans.MIDTRANS_CLIENT_KEY,
    merchantId: config.midtrans.MIDTRANS_MERCHANT_ID
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