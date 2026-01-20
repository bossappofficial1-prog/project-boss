import { FeeBearer, Order, OrderStatus, Product, StaffStatus } from '@prisma/client';
import { db } from '../../config/prisma';
import { AppError } from '../../errors/app-error';
import { Messages } from '../../constants/message';
import { HttpStatus } from '../../constants/http-status';
import { getOutletByIdService } from '../outlet.service';
import { getBusinessByIdService } from '../business.service';
import { generateOrderCode } from '../../utils';
import { CreateOrderInput } from '../../schemas/order.schema';
import { getStaffAvailabilityForWindow } from '../staff.service';

export interface OrderCreationResult {
    order: Order;
    midtransFee: number;
    appFee: number;
    feeBearer: FeeBearer;
    totalAmount: number;
}

export async function createOrderRecord(data: CreateOrderInput): Promise<OrderCreationResult> {
    const { items, outletId, bookingSlotId, staffId } = data;

    const slot = bookingSlotId
        ? await db.bookingSlot.findUnique({
            where: { id: bookingSlotId },
            include: { staff: true, product: true },
        })
        : null;

    if (bookingSlotId) {
        if (!slot) {
            throw new AppError(Messages.BOOKING_SLOT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        if (slot.status === 'BLOCKED') {
            throw new AppError(Messages.BOOKING_SLOT_UNAVAILABLE, HttpStatus.BAD_REQUEST);
        }
        if (slot.product.outletId !== outletId) {
            throw new AppError('Slot booking tidak berada pada outlet ini.', HttpStatus.FORBIDDEN);
        }
    }

    if (staffId) {
        const staff = await db.staff.findUnique({
            where: { id: staffId },
            select: {
                id: true,
                status: true,
                role: true,
                outletId: true,
            },
        });

        if (!staff) {
            throw new AppError('Staff tidak ditemukan.', HttpStatus.NOT_FOUND);
        }

        if (staff.outletId !== outletId) {
            throw new AppError('Staff tidak berasal dari outlet ini.', HttpStatus.FORBIDDEN);
        }

        if (staff.status !== StaffStatus.ACTIVE) {
            throw new AppError('Staff sedang tidak aktif.', HttpStatus.BAD_REQUEST);
        }

        if (slot && slot.staffId && slot.staffId !== staff.id) {
            throw new AppError('Slot ini sudah dialokasikan ke staff lain.', HttpStatus.CONFLICT);
        }
    }

    const assignedStaffId = staffId ?? slot?.staffId ?? null;

    if (slot?.staffId && staffId && slot.staffId !== staffId) {
        throw new AppError('Slot ini sudah dialokasikan ke staff lain.', HttpStatus.CONFLICT);
    }

    if (slot?.staffId && !staffId) {
        const slotStaff = slot.staff ?? await db.staff.findUnique({
            where: { id: slot.staffId },
            select: {
                id: true,
                status: true,
                role: true,
                outletId: true,
            },
        });

        if (!slotStaff) {
            throw new AppError('Staff pada slot ini tidak ditemukan.', HttpStatus.NOT_FOUND);
        }

        if (slotStaff.outletId !== outletId) {
            throw new AppError('Staff slot tidak berasal dari outlet ini.', HttpStatus.FORBIDDEN);
        }

        if (slotStaff.status !== StaffStatus.ACTIVE) {
            throw new AppError('Staff pada slot sedang tidak aktif.', HttpStatus.BAD_REQUEST);
        }
    }

    const slotStart = slot ? new Date(slot.startTime) : null;
    const slotEnd = slot ? new Date(slot.endTime) : null;
    let slotMaxParallel: number | null = null;

    if (slot) {
        if (!slotStart || !slotEnd) {
            throw new AppError('Slot booking tidak memiliki rentang waktu yang valid.', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        const staffAvailability = await getStaffAvailabilityForWindow({
            outletId,
            startTime: slotStart,
            endTime: slotEnd,
        });

        const totalStaffCount = staffAvailability.length;
        const availableStaffCount = staffAvailability.filter((member) => member.isAvailable).length;

        if (totalStaffCount <= 0) {
            throw new AppError('Belum ada staff yang ditugaskan untuk layanan ini.', HttpStatus.CONFLICT);
        }

        if (availableStaffCount <= 0) {
            throw new AppError('Tidak ada staff yang tersedia untuk slot ini.', HttpStatus.CONFLICT);
        }

        if (assignedStaffId) {
            const isStaffAvailable = staffAvailability.some(
                (member) => member.id === assignedStaffId && member.isAvailable,
            );

            if (!isStaffAvailable) {
                throw new AppError('Staff tidak tersedia pada waktu yang dipilih.', HttpStatus.CONFLICT);
            }
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

        const isDigitalPayment = data.paymentMethod === 'online'
            || (data.paymentMethod === 'qris' && Boolean(data.onlinePaymentChannel));
        const midtransFee = isDigitalPayment ? Math.ceil(subTotal * 0.02) : 0;
        const appFee = isDigitalPayment ? Math.ceil(subTotal * 0.03) : 0;
        const feeBearer = business.defaultTransactionFeeBearer;
        let totalAmount = subTotal;

        if (feeBearer === 'CUSTOMER' && isDigitalPayment) {
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
                let staffConflict = false;
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
                        if (assignedStaffId) {
                            const existingStaffId = ex.bookingSlot?.staffId ?? ex.assignedStaffId ?? null;
                            if (existingStaffId === assignedStaffId) {
                                staffConflict = true;
                            }
                        }
                    }
                }

                if (staffConflict) {
                    throw new AppError('Staff tidak tersedia pada waktu yang dipilih.', HttpStatus.CONFLICT);
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
                bookingDate: slotStart ?? (data.bookingDate ? new Date(data.bookingDate) : null),
                orderStatus: (!data.bookingSlotId && (data.paymentMethod == "cash" || data.paymentMethod == 'qris') ? "COMPLETED" : "CONFIRMED"),
                assignedStaffId: assignedStaffId,
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

        if (slot) {
            const activeBookingsForTx = await tx.bookingSlot.count({
                where: {
                    productId: slot.productId,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    orderId: { not: null },
                },
            });

            const maxParallelForTx = slotMaxParallel ?? 1;

            if (activeBookingsForTx >= maxParallelForTx) {
                throw new AppError('Slot ini sudah penuh.', HttpStatus.CONFLICT);
            }

            if (assignedStaffId) {
                const conflictingStaffBooking = await tx.bookingSlot.findFirst({
                    where: {
                        staffId: assignedStaffId,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        status: { in: ['BOOKED', 'BLOCKED'] },
                    },
                });

                if (conflictingStaffBooking) {
                    throw new AppError('Staff tidak tersedia pada waktu yang dipilih.', HttpStatus.CONFLICT);
                }
            }

            await tx.bookingSlot.create({
                data: {
                    productId: slot.productId,
                    date: new Date(slot.date),
                    startTime: slotStart!,
                    endTime: slotEnd!,
                    status: 'BOOKED',
                    orderId: order.id,
                    staffId: assignedStaffId ?? slot.staffId ?? null,
                },
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