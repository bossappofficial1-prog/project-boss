import { snap, coreApi } from '../config/midtrans';
import { getOrderByIdService } from './order.service';
import { db } from '../config/prisma';
import { PaymentStatus, Order, OrderItem, Product, GuestCustomer, FeeBearer } from '@prisma/client';
import { messagePublisher } from './message-publisher.service';

type OrderWithDetails = Order & {
    items: (OrderItem & { product: Product })[];
    guestCustomer: GuestCustomer;
};

export async function createMidtransTransactionService(orderId: string, finalAmount: number, midtransFee: number, appFee: number, paymentMethod: 'online' | 'qris', chargedTo: 'customer' | 'owner') {
    const order = await getOrderByIdService(orderId) as OrderWithDetails;
    if (!order) {
        throw new Error('Order not found');
    }

    const itemDetails = order.items.map(item => ({
        id: item.productId,
        name: item.product.name,
        price: Math.round(item.priceAtTimeOfOrder),
        quantity: item.quantity,
    }));

    // Selalu tambahkan biaya Midtrans sebagai item terpisah
    if (midtransFee > 0) {
        itemDetails.push({
            id: 'midtrans_fee',
            name: 'Biaya Admin Midtrans (1%)',
            price: midtransFee,
            quantity: 1,
        });
    }

    // Tambahkan biaya aplikasi sebagai item terpisah jika ada
    if (appFee > 0) {
        itemDetails.push({
            id: 'app_fee',
            name: 'Biaya Admin Aplikasi (3%)',
            price: appFee,
            quantity: 1,
        });
    }

    // Hitung gross_amount final dari item_details yang sudah lengkap
    // untuk memastikan tidak ada selisih.
    const calculatedGrossAmount = itemDetails.reduce((acc, item) => {
        return acc + (item.price * item.quantity);
    }, 0);

    const parameter = {
        transaction_details: {
            order_id: order.id,
            gross_amount: calculatedGrossAmount,
        },
        customer_details: {
            first_name: order.guestCustomer.name,
            email: order.guestCustomer.email,
            phone: order.guestCustomer.phone,
        },
        item_details: itemDetails,
        expiry: {
            unit: "minute",
            duration: 15
        }
    };

    const transaction = await snap.createTransaction(parameter);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.transaction.create({
        data: {
            orderId: order.id,
            amount: calculatedGrossAmount, // Gunakan juga di sini untuk konsistensi
            status: PaymentStatus.PENDING,
            externalId: transaction.token, // Snap token
            paymentUrl: transaction.redirect_url, // URL pembayaran
            expiresAt: expiresAt,
        },
    });

    return transaction;
}

export async function createQrisPaymentService(orderId: string) {
    const order = await getOrderByIdService(orderId);
    if (!order) {
        throw new Error('Order not found');
    }

    const parameter = {
        payment_type: "qris",
        transaction_details: {
            order_id: order.id,
            gross_amount: order.totalAmount,
        },
        custom_expiry: {
            order_time: new Date().toISOString().slice(0, 19) + " +0700",
            expiry_duration: 15,
            unit: "minute"
        }
    };

    const chargeResponse = await coreApi.charge(parameter);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Save transaction details to our database
    await db.transaction.create({
        data: {
            orderId: order.id,
            amount: order.totalAmount,
            status: PaymentStatus.PENDING,
            externalId: chargeResponse.transaction_id,
            // Untuk QRIS, tidak ada URL redirect langsung, tapi kita bisa simpan link ke gambar QR
            paymentUrl: chargeResponse.actions?.find((a: any) => a.name === 'deeplink-redirect')?.url || chargeResponse.actions?.find((a: any) => a.name === 'generate-qr-code')?.url,
            expiresAt: expiresAt,
        },
    });

    return chargeResponse;
}

// Fungsi handleMidtransNotificationService telah dipindahkan ke payment.worker.ts di consumer
