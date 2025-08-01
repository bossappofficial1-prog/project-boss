import { db } from '../config/prisma';
import { AppError } from '../errors/app-error';
import { HttpStatus } from '../constants/http-status';
import { Promo } from '@prisma/client';
import { getBusinessByIdService } from './business.service';

/**
 * Create a new promo for a business
 */
export async function createPromo(data: Omit<Promo, 'id' | 'createdAt' | 'updatedAt' | 'timesUsed'>) {
    await getBusinessByIdService(data.businessId)

    const existingPromo = await db.promo.findUnique({
        where: { businessId_code: { businessId: data.businessId, code: data.code } },
    });

    if (existingPromo) {
        throw new AppError('Promo code already exists for this business', HttpStatus.CONFLICT);
    }

    return db.promo.create({ data });
}

/**
 * Get all promos for a business
 */
export async function getPromosByBusiness(businessId: string) {
    return db.promo.findMany({ where: { businessId } });
}

/**
 * Get a single promo by its ID
 */
export async function getPromoById(promoId: string) {
    const promo = await db.promo.findUnique({ where: { id: promoId } });
    if (!promo) {
        throw new AppError('Promo not found', HttpStatus.NOT_FOUND);
    }
    return promo;
}

/**
 * Validate and apply a promo to an order
 */
export async function applyPromoToOrder(promoCode: string, orderId: string) {
    const order = await db.order.findUnique({
        where: { id: orderId },
        include: { outlet: true }, // Sertakan relasi outlet
    });

    if (!order) {
        throw new AppError('Order not found', HttpStatus.NOT_FOUND);
    }

    const promo = await db.promo.findFirst({
        where: {
            code: promoCode,
            businessId: order.outlet.businessId, // Sekarang ini valid
        },
    });

    if (!promo) {
        throw new AppError('Invalid promo code', HttpStatus.BAD_REQUEST);
    }

    // --- Validation Checks ---
    if (promo.status !== 'ACTIVE') {
        throw new AppError('This promo is not active', HttpStatus.BAD_REQUEST);
    }
    if (new Date() > promo.validUntil) {
        throw new AppError('This promo has expired', HttpStatus.BAD_REQUEST);
    }
    if (promo.maxUses && promo.timesUsed >= promo.maxUses) {
        throw new AppError('This promo has reached its usage limit', HttpStatus.BAD_REQUEST);
    }
    if (promo.minPurchaseAmount && order.totalAmount < promo.minPurchaseAmount) {
        throw new AppError(`Minimum purchase of ${promo.minPurchaseAmount} is required`, HttpStatus.BAD_REQUEST);
    }

    // --- Calculate Discount ---
    let discountAmount = 0;
    if (promo.type === 'PERCENTAGE') {
        discountAmount = (order.totalAmount * promo.value) / 100;
    } else if (promo.type === 'FIXED_AMOUNT') {
        discountAmount = promo.value;
    }

    // Ensure discount doesn't exceed total amount
    discountAmount = Math.min(discountAmount, order.totalAmount);

    // --- Apply Discount to Order ---
    const updatedOrder = await db.order.update({
        where: { id: orderId },
        data: {
            promoId: promo.id,
            discountAmount,
            totalAmount: order.totalAmount - discountAmount,
        },
    });

    // Increment promo usage count
    await db.promo.update({
        where: { id: promo.id },
        data: { timesUsed: { increment: 1 } },
    });

    return { updatedOrder, discountAmount };
}
