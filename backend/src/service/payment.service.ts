import { snap, coreApi } from '../config/midtrans';
import { getOrderByIdService } from './order.service';
import { db } from '../config/prisma';
import { PaymentStatus, Order, OrderItem, Product, GuestCustomer, FeeBearer } from '@prisma/client';
import { NotificationService } from './notification.service';
import { getRabbitMQChannel } from '../config/rabbitmq';

type OrderWithDetails = Order & {
    items: (OrderItem & { product: Product })[];
    guestCustomer: GuestCustomer;
};

export async function createMidtransTransactionService(orderId: string, finalAmount: number, midtransFee: number, platformFee: number, paymentMethod: 'online' | 'qris', chargedTo: 'customer' | 'owner') {
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
            name: 'Biaya Layanan', // Nama yang lebih umum
            price: midtransFee,
            quantity: 1,
        });
    }

    // Tambahkan biaya platform (booking fee) sebagai item terpisah jika ada
    if (platformFee > 0) {
        itemDetails.push({
            id: 'platform_fee',
            name: 'Biaya Booking',
            price: platformFee,
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
            gross_amount: calculatedGrossAmount, // Gunakan hasil perhitungan yang pasti
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

export async function handleMidtransNotificationService(notification: any) {
    const statusResponse = await snap.transaction.notification(notification);
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    let paymentStatus: PaymentStatus = PaymentStatus.PENDING;

    if (transactionStatus == 'capture') {
        if (fraudStatus == 'accept') {
            paymentStatus = PaymentStatus.SUCCESS;
        }
    } else if (transactionStatus == 'settlement') {
        paymentStatus = PaymentStatus.SUCCESS;
    } else if (transactionStatus == 'cancel' ||
        transactionStatus == 'deny' ||
        transactionStatus == 'expire') {
        paymentStatus = PaymentStatus.FAILED;
    }

    // Update our database
    const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: {
                    product: true, // Sertakan detail produk
                },
            },
            bookingSlot: true,
            guestCustomer: true,
            outlet: true, // Sertakan detail outlet
        },
    });

    if (!order) return;

    let orderStatus = order.orderStatus;
    if (paymentStatus === PaymentStatus.SUCCESS) {

        // Logika 1: Pesanan ini adalah JANJI TEMU (berbasis jadwal)
        if (order.bookingSlot) {
            orderStatus = 'CONFIRMED' as any; // Status lebih deskriptif untuk janji temu
            await db.bookingSlot.update({
                where: { id: order.bookingSlot.id },
                data: { status: 'BOOKED' },
            });
            // Di sini Anda bisa menambahkan notifikasi khusus untuk janji temu jika perlu
            // Contoh: NotificationService.sendAppointmentConfirmation(order as any);
        }
        // Logika 2: Pesanan ini adalah ANTRIAN LANGSUNG
        else if (order.items.some(item => item.product.type === 'SERVICE')) {
            orderStatus = 'PROCESSING'; // Status untuk yang sedang mengantri

            const channel = getRabbitMQChannel();
            const queue = 'service_order_queue';
            await channel.assertQueue(queue, { durable: true });
            channel.sendToQueue(queue, Buffer.from(JSON.stringify({ orderId: order.id })), { persistent: true });
        }
        // Logika 3: Pesanan ini hanya berisi produk GOODS (tidak ada layanan)
        else {
            orderStatus = 'READY'; // Langsung siap diambil/dikirim
        }

        // Kirim notifikasi konfirmasi umum setelah semua logika selesai
        NotificationService.sendOrderConfirmation(order as any);

    } else if (paymentStatus === PaymentStatus.FAILED) {
        orderStatus = 'CANCELLED';
        if (order.bookingSlot) {
            await db.bookingSlot.update({
                where: { id: order.bookingSlot.id },
                data: { status: 'AVAILABLE' },
            });
        }
        // Kembalikan stok untuk produk GOODS
        for (const item of order.items) {
            const product = await db.product.findUnique({ where: { id: item.productId } });
            if (product && product.type === 'GOODS') {
                await db.product.update({
                    where: { id: product.id },
                    data: { quantity: { increment: item.quantity } },
                });
            }
        }
    }

    await db.order.update({
        where: { id: orderId },
        data: { paymentStatus, orderStatus },
    });

    await db.transaction.updateMany({
        where: { orderId: orderId },
        data: {
            status: paymentStatus,
            // rawPaymentGatewayResponse: notification,
        },
    });

    return;
}
