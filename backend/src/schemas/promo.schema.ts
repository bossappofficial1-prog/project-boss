import { z } from 'zod';
import { PromoType, PromoStatus } from '@prisma/client';

export const createPromoSchema = z.object({
    code: z.string().min(3, 'Promo code must be at least 3 characters long').toUpperCase(),
    description: z.string().optional(),
    type: z.nativeEnum(PromoType),
    value: z.number().positive('Discount value must be positive'),
    status: z.nativeEnum(PromoStatus).default(PromoStatus.ACTIVE),
    maxUses: z.number().int().positive().optional(),
    minPurchaseAmount: z.number().positive().optional(),
    validFrom: z.string().datetime(),
    validUntil: z.string().datetime(),
    businessId: z.string().uuid(),
});

export const updatePromoSchema = createPromoSchema.partial();

export const applyPromoSchema = z.object({
    promoCode: z.string(),
    orderId: z.string().uuid(),
});
