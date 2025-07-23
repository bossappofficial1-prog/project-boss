import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { BookingRepository } from "../repositories/booking.repository";
import { CreateBookingSlotInput, UpdateBookingSlotInput } from "../schemas/booking.schema";
import { getProductByIdService } from "./product.service";
import { createMidtransTransactionService } from './payment.service';
import { getOrderByIdService } from './order.service';
import { db } from '../config/prisma';
import { config } from '../config';

export async function createBookingSlotService(data: CreateBookingSlotInput) {
    const product = await getProductByIdService(data.productId);
    if (product.type !== 'SERVICE') {
        throw new AppError("Booking slots can only be created for SERVICE type products.", HttpStatus.BAD_REQUEST);
    }
    const bookingSlot = await BookingRepository.create(data);
    return bookingSlot;
}

export async function createBookingAndMidtransTransactionService(data: CreateBookingSlotInput, orderId: string) {
    const bookingSlot = await createBookingSlotService(data);

    // Get order details untuk menghitung fees
    const order = await getOrderByIdService(orderId);

    // Hitung fees sesuai struktur baru
    const midtransFee = Math.round(order.totalAmount * 0.007); // 0.7%
    const appFee = Math.round(order.totalAmount * 0.02); // 2%

    // Tentukan payment method - untuk booking biasanya QRIS
    const paymentMethod: 'online' | 'qris' = 'qris';

    // Gunakan chargedTo dari order yang sudah ada
    const chargedTo = order.chargedTo.toLowerCase() as 'customer' | 'owner';

    // Total amount yang akan ditagih ke customer (termasuk fees jika ditanggung customer)
    let finalAmount = order.totalAmount;
    if (chargedTo === 'customer') {
        finalAmount += midtransFee + appFee;
    }

    const midtransTransaction = await createMidtransTransactionService(
        orderId,
        finalAmount,
        midtransFee,
        appFee,
        paymentMethod,
        chargedTo
    );

    await db.order.update({
        where: { id: orderId },
        data: {
            midtransTransactionToken: midtransTransaction.token,
            midtransRedirectUrl: midtransTransaction.redirect_url,
            bookingSlot: {
                connect: {
                    id: bookingSlot.id,
                },
            },
        },
    });

    return { bookingSlot, midtransTransaction };
}

export async function getBookingSlotByIdService(id: string) {
    const bookingSlot = await BookingRepository.findById(id);
    if (!bookingSlot) {
        throw new AppError(Messages.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return bookingSlot;
}

export async function getBookingSlotsByProductIdService(productId: string) {
    const bookingSlots = await BookingRepository.findByProductId(productId);
    return bookingSlots;
}

export async function updateBookingSlotService(id: string, data: UpdateBookingSlotInput) {
    await getBookingSlotByIdService(id);
    const bookingSlot = await BookingRepository.update(id, data);
    return bookingSlot;
}

export async function deleteBookingSlotService(id: string) {
    await getBookingSlotByIdService(id);
    const bookingSlot = await BookingRepository.delete(id);
    return bookingSlot;
}