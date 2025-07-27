import { db } from '../config/prisma';
import { HttpStatus } from '../constants/http-status';
import { AppError } from '../errors/app-error';
import { messagePublisher } from './message-publisher.service';

export async function handlePaymentSuccess(orderId: string) {
    const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
            items: { include: { product: true } },
            bookingSlot: true,
            outlet: true,
        },
    });

    if (!order) {
        throw new AppError("Order not found", HttpStatus.NOT_FOUND);
    }
    if (order.paymentStatus === 'SUCCESS') {
        console.log(`Payment for order ${orderId} has already been processed. Skipping.`);
        return;
    }

    let orderStatus = order.orderStatus;
    if (order.bookingSlot) {
        orderStatus = 'CONFIRMED';
        await db.bookingSlot.update({
            where: { id: order.bookingSlot.id },
            data: { status: 'BOOKED' },
        });
    } else if (order.items.some(item => item.product.type === 'SERVICE')) {
        orderStatus = 'PROCESSING';
        await messagePublisher.publishServiceOrderProcessing(order.id);
    } else {
        orderStatus = 'READY';
    }

    // Gunakan transaksi Prisma untuk memastikan semua pembaruan berhasil atau tidak sama sekali
    await db.$transaction(async (tx) => {
        // 2. Perbarui status pesanan
        await tx.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'SUCCESS', orderStatus },
        });

        // 3. Perbarui saldo dompet bisnis
        await tx.wallet.update({
            where: { businessId: order.outlet.businessId },
            data: {
                balance: {
                    increment: order.totalAmount,
                },
            },
        });

        // Logika booking slot jika ada
        if (order.bookingSlot) {
            await tx.bookingSlot.update({
                where: { id: order.bookingSlot.id },
                data: { status: 'BOOKED' },
            });
        }
    });

    // Terbitkan event setelah transaksi database selesai
    await messagePublisher.publishOrderStatusUpdate(order.id, orderStatus);
}

export async function handlePaymentFailure(orderId: string) {
    const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
            items: { include: { product: true } },
            bookingSlot: true,
        },
    });

    if (!order) {
        throw new AppError("Order not found", HttpStatus.NOT_FOUND);
    }
    if (order.paymentStatus !== 'PENDING') {
        // Idempotency: Jika statusnya bukan PENDING, berarti sudah diproses (gagal/sukses).
        // Jangan proses ulang.
        console.log(`Payment for order ${orderId} is not in PENDING state. Skipping failure update.`);
        return;
    }

    await db.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'FAILED', orderStatus: 'CANCELLED' },
    });

    if (order.bookingSlot) {
        await db.bookingSlot.update({
            where: { id: order.bookingSlot.id },
            data: { status: 'AVAILABLE' },
        });
    }

    for (const item of order.items) {
        if (item.product.type === 'GOODS') {
            await db.product.update({
                where: { id: item.productId },
                data: { quantity: { increment: item.quantity } },
            });
        }
    }
}
