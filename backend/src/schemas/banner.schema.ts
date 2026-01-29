import { z } from 'zod';

export const createBannerSchema = z.object({
    title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
    subtitle: z.string().optional(),
    imageUrl: z.string(),
    ctaType: z.enum(['none', 'url', 'deep-link']).optional(),
    ctaPayload: z.string().optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
    businessId: z.string().optional(),
});

export type CreateBannerInput = z.infer<typeof createBannerSchema>;

export const updateBannerSchema = z.object({
    title: z.string().min(3).optional(),
    subtitle: z.string().optional(),
    imageUrl: z.string().optional(),
    ctaType: z.enum(['none', 'url', 'deep-link']).optional(),
    ctaPayload: z.string().optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
});

export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;

export const bulkOrderSchema = z.array(
    z.object({
        id: z.string().min(1, "id tidak boleh kosong"),
        order: z.number().int("order harus bilangan bulat").nonnegative("order tidak boleh negatif"),
    })
);

export type bulkOrderSValues = z.infer<typeof bulkOrderSchema>
