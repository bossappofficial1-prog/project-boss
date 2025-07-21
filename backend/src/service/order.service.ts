import { OrderStatus, Product } from "@prisma/client";
import { db } from "../config/prisma";
import { getRabbitMQChannel } from "../config/rabbitmq";
import { getSocketIO } from "../config/socket";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { OrderRepository } from "../repositories/order.repository";
import { ProductRepository } from "../repositories/product.repository";
import { CreateOrderInput } from "../schemas/order.schema";
import { createMidtransTransactionService } from './payment.service';
import { getOutletByIdService } from "./outlet.service";
import { getBusinessByIdService } from "./business.service"; // Impor service bisnis

export async function createOrderService(data: CreateOrderInput) {
    const { items, outletId } = data;

    // 1. Dapatkan detail outlet dan bisnis
    const outlet = await getOutletByIdService(outletId);
    const business = await getBusinessByIdService(outlet.businessId);

    // 2. Validasi produk dan hitung subtotal
    let subTotal = 0;
    const productDetails: (Product & { orderQuantity: number })[] = [];
    let hasServiceProduct = false;

    for (const item of items) {
        const product = await ProductRepository.findById(item.productId);
        if (!product) {
            throw new AppError(`Produk dengan ID ${item.productId} tidak ditemukan`, HttpStatus.NOT_FOUND);
        }
        if (product.type === 'GOODS' && (!product.quantity || product.quantity < item.quantity)) {
            throw new AppError(`Stok produk ${product.name} tidak mencukupi`, HttpStatus.BAD_REQUEST);
        }
        if (product.type === 'SERVICE') {
            hasServiceProduct = true;
        }
        subTotal += product.price * item.quantity;
        productDetails.push({ ...product, orderQuantity: item.quantity });
    }

    // 3. Hitung biaya-biaya
    // Biaya Midtrans selalu 1% dari subtotal
    const midtransFee = Math.round(subTotal * 0.01);

    // Biaya booking hanya jika ada produk JASA
    const bookingFee = hasServiceProduct ? 5000 : 0; // Contoh biaya booking tetap 5000

    // Tentukan siapa yang menanggung biaya booking
    const feeBearer = business.defaultTransactionFeeBearer;
    let totalAmount = subTotal + midtransFee;
    if (feeBearer === 'CUSTOMER' && hasServiceProduct) {
        totalAmount += bookingFee;
    }

    // 4. Buat pesanan dan kurangi stok dalam satu transaksi atomik
    const order = await OrderRepository.create(data, outlet, totalAmount, bookingFee, feeBearer, productDetails);

    // 5. Update harga per item
    await db.$transaction(async (tx) => {
        for (const product of productDetails) {
            await tx.orderItem.updateMany({
                where: { orderId: order.id, productId: product.id },
                data: { priceAtTimeOfOrder: product.price },
            });
        }
    });

    // Emit a real-time event to the dashboard
    const io = getSocketIO();
    io.emit('new_order', await OrderRepository.findById(order.id));

    return {
        order,
        midtransFee,
        bookingFee,
        feeBearer,
        totalAmount,
    };
}

export async function getOrderByIdService(id: string) {
    const order = await OrderRepository.findById(id);
    if (!order) {
        throw new AppError(Messages.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return order;
}

export async function refundOrderService(orderId: string) {
    const order = await getOrderByIdService(orderId);

    if (order?.paymentStatus === 'REFUNDED') {
        throw new AppError("Pesanan ini sudah di-refund.", HttpStatus.BAD_REQUEST);
    }

    return db.$transaction(async (tx) => {
        // 1. Update order status
        const refundedOrder = await tx.order?.update({
            where: { id: orderId },
            data: { paymentStatus: 'REFUNDED' },
        });

        // 2. Create an expense entry for the refund
        await tx.expense.create({
            data: {
                outletId: order?.outletId,
                description: `Refund untuk pesanan #${order?.id}`,
                amount: order?.totalAmount,
                date: new Date(),
            },
        });

        return refundedOrder;
    });
}

export async function createOrderAndMidtransTransactionService(data: CreateOrderInput, paymentMethod: 'online' | 'qris') {
    // Panggil service yang sudah di-refactor
    const { order, midtransFee, bookingFee, feeBearer, totalAmount } = await createOrderService(data);

    const chargeTo = feeBearer.toLowerCase() as 'customer' | 'owner';

    // Biaya platform (booking fee) hanya ditambahkan jika ditanggung customer
    const platformFee = (chargeTo === 'customer' && bookingFee > 0) ? bookingFee : 0;

    const midtransTransaction = await createMidtransTransactionService(order.id, totalAmount, midtransFee, platformFee, paymentMethod, chargeTo);

    await db.order.update({
        where: { id: order.id },
        data: {
            midtransTransactionToken: midtransTransaction.token,
            midtransRedirectUrl: midtransTransaction.redirect_url,
            platformFee: platformFee,
            chargedTo: chargeTo.toUpperCase() as any,
        },
    });

    return { order, midtransTransaction };
}

export async function updateOrderStatusService(orderId: string, status: OrderStatus) {
    const order = await getOrderByIdService(orderId);

    if (status === 'COMPLETED' && order?.bookingSlot) {
        await db.bookingSlot.update({
            where: { id: order?.bookingSlot.id },
            data: { status: 'AVAILABLE' },
        });
    }

    const updatedOrder = await db.order?.update({
        where: { id: orderId },
        data: { orderStatus: status },
    });

    // Kirim notifikasi status update ke RabbitMQ
    const channel = getRabbitMQChannel();
    const queue = 'notification_queue';
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify({ orderId: updatedOrder?.id, status: updatedOrder?.orderStatus })), { persistent: true });

    return updatedOrder;
}

export async function completeServiceOrderService(orderId: string) {
    // 1. Update status pesanan menjadi COMPLETED
    const completedOrder = await db.order.update({
        where: { id: orderId },
        data: { orderStatus: OrderStatus.COMPLETED },
        include: { items: { include: { product: true } } }
    });

    // 2. Periksa apakah pesanan yang selesai adalah pesanan layanan
    const hasServiceProduct = completedOrder.items.some(item => item.product.type === 'SERVICE');

    // 3. Jika ya, picu ulang pengecekan antrian untuk outlet tersebut
    if (hasServiceProduct) {
        const channel = getRabbitMQChannel();
        const queue = 'service_order_queue';
        await channel.assertQueue(queue, { durable: true });

        // Kirim pesan "dummy" dengan orderId dari pesanan yang baru selesai.
        // Worker akan menggunakan orderId ini untuk mendapatkan outletId dan memeriksa ulang seluruh antrian.
        channel.sendToQueue(queue, Buffer.from(JSON.stringify({ orderId: completedOrder.id, trigger: 're-check' })), { persistent: true });
    }

    return completedOrder;
}