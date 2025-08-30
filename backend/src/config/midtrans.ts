import midtransClient from 'midtrans-client';
import crypto from "crypto"
import { config } from '.';

export const snap = new midtransClient.Snap({
    isProduction: config.midtrans.isProduction,
    serverKey: config.midtrans.serverKey,
    clientKey: config.midtrans.clientKey
});

export const coreApi = new midtransClient.CoreApi({
    isProduction: config.midtrans.isProduction,
    serverKey: config.midtrans.serverKey,
    clientKey: config.midtrans.clientKey
});

export const verifyMidtransSignature = (
    orderId: string,
    statusCode: string,
    grossAmount: string,
    signatureKey: string

): boolean => {
    const payload = orderId + statusCode + grossAmount + config.midtrans.serverKey
    const expectedSignature = crypto
        .createHash("sha512")
        .update(payload)
        .digest("hex")

    return expectedSignature === signatureKey
}