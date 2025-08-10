import { OrderStatus, Product } from "@prisma/client";
import { db } from "../config/prisma";
import { getRabbitMQChannel } from "../config/rabbitmq";
import { messagePublisher } from "./message-publisher.service";
import { getSocketIO } from "../config/socket";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { OrderRepository } from "../repositories/order.repository";
import { CreateOrderInput } from "../schemas/order.schema";
import { createMidtransTransactionService } from './payment.service';
import { getOutletByIdService } from "./outlet.service";
import { getBusinessByIdService } from "./business.service"; // Impor service bisnis
import { generateOrderCode } from "../utils";
import { BookingRepository } from "../repositories/booking.repository";

// List goods orders by outlet with optional status filter and pagination
export async function getGoodsOrdersByOutletService(
    outletId: string,
    ownerId: string,
    options?: { status?: OrderStatus; page?: number; limit?: number }
) {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(100, Math.max(1, options?.limit || 20));
    const skip = (page - 1) * limit;

    // Ownership validation
    const outlet = await getOutletByIdService(outletId);
    const business = await getBusinessByIdService(outlet.businessId);
    if (business.ownerId !== ownerId) {
        throw new AppError("Anda tidak berhak mengakses outlet ini.", HttpStatus.FORBIDDEN);
    }

    const baseWhere = {
        outletId,
        ...(options?.status ? { orderStatus: options.status } : {}),
        items: {
            some: {
                product: { type: 'GOODS' }
            }
        }
    } as const;

    const [total, orders] = await db.$transaction([
        db.order.count({ where: baseWhere as any }),
        db.order.findMany({
            where: baseWhere as any,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                items: { include: { product: true } },
                guestCustomer: true
            }
        })
    ]);

    return {
        data: orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}

// List service queue by outlet (READY orders with SERVICE items), ordered by createdAt asc and position
export async function getServiceQueueByOutletService(
    outletId: string,
    ownerId: string,
    options?: { page?: number; limit?: number }
) {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(100, Math.max(1, options?.limit || 50));
    const skip = (page - 1) * limit;

    // Ownership validation
    const outlet = await getOutletByIdService(outletId);
    const business = await getBusinessByIdService(outlet.businessId);
    if (business.ownerId !== ownerId) {
        throw new AppError("Anda tidak berhak mengakses outlet ini.", HttpStatus.FORBIDDEN);
    }

    const where = {
        outletId,
        orderStatus: OrderStatus.READY,
        items: { some: { product: { type: 'SERVICE' } } }
    } as const;

    const [total, orders] = await db.$transaction([
        db.order.count({ where: where as any }),
        db.order.findMany({
            where: where as any,
            orderBy: { createdAt: 'asc' },
            skip,
            take: limit,
            include: {
                items: { include: { product: true } },
                guestCustomer: true,
                bookingSlot: true
            }
        })
    ]);

    const data = orders.map((o, idx) => ({
        position: skip + idx + 1,
        ...o
    }));

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}

async function createOrderInDbService(data: CreateOrderInput) {
    const { items, outletId, bookingSlotId } = data;

    // Validasi booking slot jika ada
    if (bookingSlotId) {
        const slot = await db.bookingSlot.findUnique({ where: { id: bookingSlotId } });
        if (!slot) {
            throw new AppError(Messages.BOOKING_SLOT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        if (slot.status !== 'AVAILABLE') {
            throw new AppError(Messages.BOOKING_SLOT_UNAVAILABLE, HttpStatus.BAD_REQUEST);
        }
    }

    const outlet = await getOutletByIdService(outletId);
    const business = await getBusinessByIdService(outlet.businessId);

    // SECURITY FIX: Use transaction for atomic stock check and order creation
    return await db.$transaction(async (tx) => {
        let subTotal = 0;
        const productDetails: (Product & { orderQuantity: number })[] = [];

        // SECURITY FIX: Check stock and reserve it atomically
        for (const item of items) {
            const product = await tx.product.findUnique({
                where: { id: item.productId },
                select: {
                    id: true,
                    name: true,
                    price: true,
                    type: true,
                    quantity: true,
                    outletId: true,
                    status: true
                }
            });

            if (!product) {
                throw new AppError(`Produk dengan ID ${item.productId} tidak ditemukan`, HttpStatus.NOT_FOUND);
            }

            // SECURITY FIX: Validate product belongs to the outlet
            if (product.outletId !== outletId) {
                throw new AppError(`Produk ${product.name} tidak tersedia di outlet ini`, HttpStatus.BAD_REQUEST);
            }

            // SECURITY FIX: Check if product is active
            if (product.status !== 'ACTIVE') {
                throw new AppError(`Produk ${product.name} tidak aktif`, HttpStatus.BAD_REQUEST);
            }

            // SECURITY FIX: Validate quantity limits
            if (item.quantity <= 0 || item.quantity > 1000) {
                throw new AppError(`Quantity tidak valid untuk produk ${product.name}`, HttpStatus.BAD_REQUEST);
            }

            // SECURITY FIX: Atomic stock check and decrement
            if (product.type === 'GOODS') {
                if (!product.quantity || product.quantity < item.quantity) {
                    throw new AppError(`Stok produk ${product.name} tidak mencukupi. Tersedia: ${product.quantity}`, HttpStatus.BAD_REQUEST);
                }

                // Immediately decrement stock to prevent race conditions
                await tx.product.update({
                    where: { id: product.id },
                    data: { quantity: { decrement: item.quantity } },
                });
            }

            subTotal += product.price * item.quantity;
            productDetails.push({
                ...product,
                orderQuantity: item.quantity,
                quantity: product.quantity || 0,
                costPrice: 0,
                description: null,
                unit: null,
                transactionFeeBearer: null,
                serviceDurationMinutes: null,
                image: null,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        // SECURITY FIX: Validate minimum and maximum order amount
        if (subTotal < 1000) { // Minimum 1000 rupiah
            throw new AppError("Minimum order adalah Rp 1.000", HttpStatus.BAD_REQUEST);
        }
        if (subTotal > 50000000) { // Maximum 50 juta rupiah
            throw new AppError("Maximum order adalah Rp 50.000.000", HttpStatus.BAD_REQUEST);
        }

        // SECURITY: Additional validation for suspicious order patterns
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        if (totalItems > 100) {
            throw new AppError("Terlalu banyak item dalam satu pesanan", HttpStatus.BAD_REQUEST);
        }

        // SECURITY: Check if order value is suspicious (too high per item)
        const averageItemPrice = subTotal / totalItems;
        if (averageItemPrice > 1000000) { // Average > 1 juta per item
            console.warn(`[SUSPICIOUS ORDER] High average item price: ${averageItemPrice} for phone: ${data.guestCustomer.phone.slice(-4)}`);
        }

        const midtransFee = Math.round(subTotal * 0.01); // 1% midtrans fee
        const appFee = Math.round(subTotal * 0.03); // 3% platform fee
        const feeBearer = business.defaultTransactionFeeBearer;
        let totalAmount = subTotal;

        if (feeBearer === 'CUSTOMER') {
            totalAmount += midtransFee + appFee;
        }

        // SECURITY: Log high-value orders for monitoring
        if (totalAmount > 5000000) { // Orders above 5 million
            console.warn(`[HIGH VALUE ORDER] Amount: ${totalAmount} for phone: ${data.guestCustomer.phone.slice(-4)}`);
        }

        // SECURITY: Create guest customer with sanitized data
        let customer = await tx.guestCustomer.findFirst({
            where: { phone: data.guestCustomer.phone },
        });

        if (!customer) {
            // SECURITY: Sanitize and validate guest customer data
            const sanitizedGuestData = {
                name: data.guestCustomer.name.trim().replace(/\s+/g, ' '), // Normalize whitespace
                phone: data.guestCustomer.phone.replace(/[^\d+]/g, ''), // Keep only digits and +
            };

            // SECURITY: Additional validation
            if (sanitizedGuestData.name.length < 2 || sanitizedGuestData.name.length > 100) {
                throw new AppError("Nama tidak valid", HttpStatus.BAD_REQUEST);
            }

            if (sanitizedGuestData.phone.length < 10 || sanitizedGuestData.phone.length > 15) {
                throw new AppError("Nomor telepon tidak valid", HttpStatus.BAD_REQUEST);
            }

            customer = await tx.guestCustomer.create({
                data: sanitizedGuestData,
            });

            // SECURITY: Log new guest customer creation
            console.log(`[NEW GUEST] Created guest customer with phone ending: ${sanitizedGuestData.phone.slice(-4)}`);
        } else {
            // SECURITY: Log returning guest customer
            console.log(`[RETURNING GUEST] Found existing customer with phone ending: ${customer.phone?.slice(-4) || 'unknown'}`);
        }

        // Create order
        const order = await tx.order.create({
            data: {
                id: generateOrderCode({ name: outlet.name, maxLength: 12 }, { randomLength: 6 }),
                guestCustomerId: customer.id,
                outletId,
                totalAmount,
                midtransFee: midtransFee,
                appFee: appFee,
                chargedTo: feeBearer,
                bookingDate: data.bookingDate ? new Date(data.bookingDate) : null,
            },
        });

        // Create order items
        await tx.orderItem.createMany({
            data: items.map((item) => ({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                priceAtTimeOfOrder: productDetails.find(p => p.id === item.productId)?.price || 0,
            })),
        });

        // Update booking slot if exists
        if (bookingSlotId) {
            await tx.bookingSlot.update({
                where: { id: bookingSlotId },
                data: { status: 'BOOKED', orderId: order.id },
            });
        }

        const io = getSocketIO();
        io.to(business.id).emit('new_order', await tx.order.findUnique({
            where: { id: order.id },
            include: {
                items: {
                    include: { product: true }
                },
                guestCustomer: true,
                outlet: true
            }
        }));

        return { order, midtransFee, appFee, feeBearer, totalAmount };
    });
}

export async function getOrderByIdService(id: string, ownerId?: string) {
    const order = await OrderRepository.findById(id);
    if (!order) {
        throw new AppError(Messages.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    // SECURITY FIX: Validate ownership if ownerId is provided
    if (ownerId) {
        const outlet = await getOutletByIdService(order.outletId);
        const business = await getBusinessByIdService(outlet.businessId);

        if (business.ownerId !== ownerId) {
            throw new AppError("Anda tidak berhak mengakses pesanan ini.", HttpStatus.FORBIDDEN);
        }
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

export async function createOrderAndMidtransTransactionService(data: CreateOrderInput) {
    const { paymentMethod } = data;

    if (data.bookingSlotId) {
        const slot = await BookingRepository.getSlots(data.bookingSlotId)

        if (!slot) throw new AppError(Messages.BOOKING_SLOT_NOT_FOUND, HttpStatus.NOT_FOUND);
        if (slot.status === "BOOKED") throw new AppError(Messages.BOOKING_SLOT_ALREADY_BOOKED, HttpStatus.CONFLICT);

        // Lock slot untuk mencegah race condition
        await BookingRepository.update(slot.id, { status: "BOOKED" })
    }

    const { order, midtransFee, appFee, feeBearer, totalAmount } = await createOrderInDbService(data);

    const chargeTo = feeBearer.toLowerCase() as 'customer' | 'owner';

    const midtransTransaction = await createMidtransTransactionService(order.id, totalAmount, midtransFee, appFee, paymentMethod, chargeTo);

    const updatedOrder = await db.order.update({
        where: { id: order.id },
        data: {
            midtransTransactionToken: midtransTransaction.token,
            midtransRedirectUrl: midtransTransaction.redirect_url,
        },
    });

    return { order: updatedOrder, midtransTransaction };
}

export async function updateOrderStatusService(orderId: string, status: OrderStatus) {
    const order = await getOrderByIdService(orderId);

    if (!order) {
        throw new Error('Order not found');
    }

    if (status === 'COMPLETED' && order?.bookingSlot) {
        await db.bookingSlot.update({
            where: { id: order.bookingSlot.id },
            data: { status: 'AVAILABLE' },
        });
    }

    // Update pesanan dengan include data yang diperlukan
    const updatedOrder = await db.order.update({
        where: { id: orderId },
        data: { orderStatus: status },
        include: {
            items: {
                include: {
                    product: true
                }
            },
            outlet: true,
            guestCustomer: true
        }
    });

    // Kirim notifikasi status update melalui message publisher
    await messagePublisher.publishOrderNotification(updatedOrder.id, updatedOrder.orderStatus);

    // Jika status diubah menjadi COMPLETED dan ini adalah pesanan layanan
    if (status === 'COMPLETED' && updatedOrder.items.some(item => item.product.type === 'SERVICE')) {
        // Dapatkan antrian untuk outlet yang sama
        const queuedOrders = await db.order.findMany({
            where: {
                outletId: updatedOrder.outletId,
                orderStatus: OrderStatus.READY,
                items: {
                    some: {
                        product: {
                            type: 'SERVICE'
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            },
            include: {
                guestCustomer: true
            }
        });

        // Update posisi antrian untuk semua pesanan yang tersisa
        for (let i = 0; i < queuedOrders.length; i++) {
            const queuedOrder = queuedOrders[i];
            if (queuedOrder.guestCustomer?.phone) {
                const channel = getRabbitMQChannel();
                await channel.publish(
                    'notification_exchange',
                    '',
                    Buffer.from(JSON.stringify({
                        type: 'queue_position',
                        data: {
                            phone: queuedOrder.guestCustomer.phone,
                            position: i + 1,
                        }
                    })),
                    { persistent: true }
                );
            }
        }
    }

    return updatedOrder;
}

export async function completeServiceOrderService(orderId: string) {
    // 1. Update status pesanan menjadi COMPLETED
    const completedOrder = await db.order.update({
        where: { id: orderId },
        data: { orderStatus: OrderStatus.COMPLETED },
        include: {
            items: { include: { product: true } },
            outlet: true
        }
    });

    // 2. Periksa apakah pesanan yang selesai adalah pesanan layanan
    const hasServiceProduct = completedOrder.items.some(item => item.product.type === 'SERVICE');

    // 3. Jika ya, picu ulang pengecekan antrian untuk outlet tersebut
    if (hasServiceProduct) {
        // Dapatkan daftar pesanan dalam antrian untuk outlet ini
        const queuedOrders = await db.order.findMany({
            where: {
                outletId: completedOrder.outletId,
                orderStatus: OrderStatus.READY,
                items: {
                    some: {
                        product: {
                            type: 'SERVICE'
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            },
            include: {
                guestCustomer: true
            }
        });

        // Publish message untuk mengecek ulang antrian
        await messagePublisher.publishServiceOrderRecheck(completedOrder.id);

        // Kirim notifikasi ke pesanan berikutnya dalam antrian jika ada
        if (queuedOrders.length > 0) {
            const nextOrder = queuedOrders[0];
            if (nextOrder.guestCustomer?.phone) {
                // Kirim notifikasi bahwa giliran mereka sudah dekat
                const channel = getRabbitMQChannel();
                await channel.publish(
                    'notification_exchange',
                    '',
                    Buffer.from(JSON.stringify({
                        type: 'queue_position',
                        data: {
                            phone: nextOrder.guestCustomer.phone,
                            position: 1,
                        }
                    })),
                    { persistent: true }
                );
            }
        }
    }

    return completedOrder;
}