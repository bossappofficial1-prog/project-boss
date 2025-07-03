import Midtrans, { TransactionStatusResponse } from "midtrans-client"
import { config } from "../configs/config"
import { AppError } from "../errors/api_errors";
import { midtransConfig } from "../configs/midtrans";

const snap = new Midtrans.Snap({
    isProduction: config.midtrans.IS_PRODUCTION,
    serverKey: config.midtrans.MIDTRANS_SERVER_KEY!,
    clientKey: config.midtrans.MIDTRANS_CLIENT_KEY
})

const coreApi = new Midtrans.CoreApi({
    isProduction: config.midtrans.IS_PRODUCTION,
    serverKey: config.midtrans.MIDTRANS_SERVER_KEY!,
})

interface ItemDetails {
    id: string;
    price: number;
    quantity: number;
    name: string;
}

interface CustomerDetails {
    first_name?: string;
    last_name?: string;
    email: string;
}

/**
 * Menginisiasi transaksi pembayaran dengan Midtrans Snap.
 * @param orderId ID pesanan dari sistem.
 * @param totalAmount Total jumlah yang harus dibayar.
 * @param itemDetails Detail item yang dibeli.
 * @param customerDetails Detail pelanggan.
 * @param callbackUrl URL notifikasi Midtrans ke backend Anda.
 * @returns Promise yang mengembalikan URL redirect atau token pembayaran dari Midtrans.
 */
export async function initiateMidtransPayment(
    orderId: string,
    totalAmount: number,
    itemDetails: ItemDetails[],
    customerDetails: CustomerDetails,
    callbackUrl: string
) {
    const parameter = {
        transaction_details: {
            order_id: orderId,
            gross_amount: totalAmount,
        },
        item_details: itemDetails,
        customer_details: customerDetails,
        callbacks: {
            // Pastikan ini adalah URL publik yang dapat diakses oleh Midtrans
            notification: callbackUrl
        },
    };

    try {
        const transaction = await snap.createTransaction({
            transaction_details: parameter.transaction_details,
            item_details: parameter.item_details,
            customer_details: parameter.customer_details,
            callbacks: parameter.callbacks,
            expiry: midtransConfig.expiry
        });
        // Midtrans Snap akan mengembalikan redirect_url (untuk redirect ke halaman pembayaran)
        // atau token (untuk popup modal)
        let redirectUrl = transaction.redirect_url;
        let token = transaction.token;

        if (!redirectUrl && !token) {
            throw new AppError("Failed to get payment URL/token from Midtrans", 500);
        }

        return { redirectUrl, token };

    } catch (error: any) {
        console.error("Error initiating Midtrans payment:", error);
        // Midtrans client errors might have specific structure,
        // you might want to parse error.json() if it's a network response.
        throw new AppError(`Failed to initiate payment: ${error.message || 'Unknown error'}`, 500);
    }
}

/**
 * Melakukan charge pembayaran langsung menggunakan Midtrans Core API.
 * Contoh ini dikhususkan untuk pembayaran QRIS.
 *
 * @param orderId ID pesanan unik dari sistem Anda.
 * @param grossAmount Total jumlah yang harus dibayar.
 * @param customerDetails Detail pelanggan.
 * @returns Promise yang mengembalikan detail respons dari Midtrans charge API untuk QRIS.
 */
export async function directChargeQris(
    orderId: string,
    grossAmount: number
) {
    try {
        const chargeResponse = await coreApi.charge({
            payment_type: 'qris',
            transaction_details: {
                order_id: orderId,
                gross_amount: grossAmount
            }
        });

        console.log("Midtrans Direct Charge QRIS API Response:", chargeResponse);

        // Contoh penanganan respons awal untuk QRIS
        if (chargeResponse.transaction_status === 'pending') {
            // Untuk QRIS, respons pending akan langsung berisi QR code atau URL QR
            if (!chargeResponse.actions || chargeResponse.actions.length === 0) {
                throw new AppError("QRIS charge successful but no QR code/actions returned.", 500);
            }
            // Cari action dengan nama 'deeplink-redirect' atau 'qris-payment-url'
            const qrisAction = chargeResponse.actions.find(action =>
                action.name === 'deeplink-redirect' || action.name === 'generate-qr-code' || action.name === 'qris-url'
            );

        } else if (chargeResponse.transaction_status === 'settlement') {
            // Ini jarang terjadi untuk QRIS langsung settlement, biasanya pending dulu
            console.warn("QRIS transaction immediately settled. This is unusual but can happen.");
        }

        return chargeResponse;

    } catch (error: any) {
        console.error("Error calling Midtrans Direct Charge QRIS API:", error);
        throw new AppError(`Failed to process direct QRIS charge: ${error.message || 'Unknown error'}`, 500);
    }
}