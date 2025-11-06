import { FeeBearer, Order, OrderStatus, Product } from '@prisma/client';
import { db } from '../../config/prisma';
import { AppError } from '../../errors/app-error';
import { Messages } from '../../constants/message';
import { HttpStatus } from '../../constants/http-status';
import { getOutletByIdService } from '../outlet.service';
import { getBusinessByIdService } from '../business.service';
import { generateOrderCode } from '../../utils';
import { CreateOrderInput } from '../../schemas/order.schema';

export interface OrderCreationResult {
    order: Order;
    midtransFee: number;
    appFee: number;
    feeBearer: FeeBearer;
    totalAmount: number;
}

export async function createOrderRecord(data: CreateOrderInput): Promise<OrderCreationResult> {
    const { items, outletId, bookingSlotId } = data;

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

    return db.$transaction(async (tx) => {
        let subTotal = 0;
        const productDetails: (Product & { orderQuantity: number })[] = [];

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
                    status: true,
                    serviceDurationMinutes: true,
                },
            });

            if (!product) {
                throw new AppError(`Produk dengan ID ${item.productId} tidak ditemukan`, HttpStatus.NOT_FOUND);
            }

            if (product.outletId !== outletId) {
                throw new AppError(`Produk ${product.name} tidak tersedia di outlet ini`, HttpStatus.BAD_REQUEST);
            }

            if (product.status !== 'ACTIVE') {
                throw new AppError(`Produk ${product.name} tidak aktif`, HttpStatus.BAD_REQUEST);
            }

            if (item.quantity <= 0 || item.quantity > 1000) {
                throw new AppError(`Quantity tidak valid untuk produk ${product.name}`, HttpStatus.BAD_REQUEST);
            }

            if (product.type === 'GOODS') {
                if (!product.quantity || product.quantity < item.quantity) {
                    throw new AppError(`Stok produk ${product.name} tidak mencukupi. Tersedia: ${product.quantity}`, HttpStatus.BAD_REQUEST);
                }

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
                serviceDurationMinutes: product.serviceDurationMinutes ?? null,
                image: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        if (subTotal < 1000) {
            throw new AppError('Minimum order adalah Rp 1.000', HttpStatus.BAD_REQUEST);
        }
        if (subTotal > 50000000) {
            throw new AppError('Maximum order adalah Rp 50.000.000', HttpStatus.BAD_REQUEST);
        }

        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        if (totalItems > 100) {
            throw new AppError('Terlalu banyak item dalam satu pesanan', HttpStatus.BAD_REQUEST);
        }

        const averageItemPrice = subTotal / totalItems;
        if (averageItemPrice > 1000000) {
            console.warn(`[SUSPICIOUS ORDER] High average item price: ${averageItemPrice} for phone: ${data.guestCustomer.phone.slice(-4)}`);
        }

        const midtransFee = Math.ceil(subTotal * 0.02);
        const appFee = Math.ceil(subTotal * 0.03);
        const feeBearer = business.defaultTransactionFeeBearer;
        let totalAmount = subTotal;

        if (feeBearer === 'CUSTOMER') {
            totalAmount += midtransFee + appFee;
        }

        if (totalAmount > 5000000) {
            console.warn(`[HIGH VALUE ORDER] Amount: ${totalAmount} for phone: ${data.guestCustomer.phone.slice(-4)}`);
        }

        const serviceItems = productDetails.filter((p) => p.type === 'SERVICE');
        if (serviceItems.length > 0 && !bookingSlotId) {
            if (!data.bookingDate) {
                throw new AppError('Booking jasa wajib memiliki waktu booking.', HttpStatus.BAD_REQUEST);
            }

            const requestedStart = new Date(data.bookingDate);
            const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart < bEnd && bStart < aEnd;

            for (const svc of serviceItems) {
                const durationMin = svc.serviceDurationMinutes ?? 60;
                const requestedEnd = new Date(requestedStart.getTime() + durationMin * 60000);

                const capacityRecord = await tx.serviceCapacity.findUnique({
                    where: { productId: svc.id },
                });
                const maxParallel = capacityRecord?.maxParallel ?? 1;

                const activeStatuses = [
                    OrderStatus.AWAITING_PAYMENT,
                    OrderStatus.PROCESSING,
                    OrderStatus.READY,
                    OrderStatus.CONFIRMED,
                ];

                const existing = await tx.order.findMany({
                    where: {
                        outletId,
                        orderStatus: { in: activeStatuses },
                        items: { some: { productId: svc.id } },
                    },
                    include: {
                        bookingSlot: true,
                        items: { include: { product: { select: { id: true, serviceDurationMinutes: true, type: true } } } },
                    },
                });

                let overlapping = 0;
                for (const ex of existing) {
                    let exStart: Date | null = null;
                    let exEnd: Date | null = null;

                    if (ex.bookingSlot) {
                        exStart = new Date(ex.bookingSlot.startTime);
                        exEnd = new Date(ex.bookingSlot.endTime);
                    } else if (ex.bookingDate) {
                        const exItem = ex.items.find((it) => it.product.id === svc.id);
                        const exDuration = exItem?.product.serviceDurationMinutes ?? durationMin;
                        exStart = new Date(ex.bookingDate);
                        exEnd = new Date(exStart.getTime() + (exDuration ?? 60) * 60000);
                    }

                    if (exStart && exEnd && overlaps(requestedStart, requestedEnd, exStart, exEnd)) {
                        overlapping += 1;
                        if (overlapping >= maxParallel) break;
                    }
                }

                if (overlapping >= maxParallel) {
                    throw new AppError(`Waktu booking bentrok untuk layanan ${svc.name}. Silakan pilih waktu lain.`, HttpStatus.CONFLICT);
                }
            }
        }

        let customer = await tx.guestCustomer.findFirst({
            where: { phone: data.guestCustomer.phone },
        });

        if (!customer) {
            const sanitizedGuestData = {
                name: data.guestCustomer.name.trim().replace(/\s+/g, ' '),
                phone: data.guestCustomer.phone.replace(/[^\d+]/g, ''),
            };

            if (sanitizedGuestData.name.length < 2 || sanitizedGuestData.name.length > 100) {
                throw new AppError('Nama tidak valid', HttpStatus.BAD_REQUEST);
            }

            if (sanitizedGuestData.phone.length < 10 || sanitizedGuestData.phone.length > 15) {
                throw new AppError('Nomor telepon tidak valid', HttpStatus.BAD_REQUEST);
            }

            customer = await tx.guestCustomer.create({
                data: sanitizedGuestData,
            });

            console.log(`[NEW GUEST] Created guest customer with phone ending: ${sanitizedGuestData.phone.slice(-4)}`);
        } else {
            console.log(`[RETURNING GUEST] Found existing customer with phone ending: ${customer.phone?.slice(-4) || 'unknown'}`);
        }

        const order = await tx.order.create({
            data: {
                id: generateOrderCode({ name: outlet.name, maxLength: 12 }, { randomLength: 6 }),
                guestCustomerId: customer.id,
                outletId,
                totalAmount,
                midtransFee,
                appFee,
                chargedTo: feeBearer,
                paymentStatus: `SUCCESS`,
                bookingDate: data.bookingDate ? new Date(data.bookingDate) : null,
                orderStatus: (!data.bookingSlotId && (data.paymentMethod == "cash" || data.paymentMethod == 'qris') ? "COMPLETED" : "CONFIRMED")
            },
        });

        await tx.orderItem.createMany({
            data: items.map((item) => ({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                priceAtTimeOfOrder: productDetails.find((p) => p.id === item.productId)?.price || 0,
            })),
        });

        if (bookingSlotId) {
            await tx.bookingSlot.update({
                where: { id: bookingSlotId },
                data: { status: 'BOOKED', orderId: order.id },
            });
        }

        try {
            await tx.order.findUnique({
                where: { id: order.id },
                include: {
                    items: {
                        include: { product: true },
                    },
                    guestCustomer: true,
                    outlet: true,
                },
            });
        } catch (socketError) {
            console.error('❌ Error emitting new_order event:', socketError);
        }

        return { order, midtransFee, appFee, feeBearer, totalAmount };
    });
}