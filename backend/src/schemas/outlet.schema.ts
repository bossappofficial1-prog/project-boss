import { z } from "zod";

export const createOutletSchema = z.object({
    name: z.string().nonempty({ message: "Nama outlet tidak boleh kosong" }),
    description: z.string().optional(),
    address: z.string(),
    phone: z.string(),
    image: z.string().url().optional(),
    businessId: z.string().nonempty({ message: "ID Bisnis tidak boleh kosong" }),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
});

export type CreateOutletInput = z.infer<typeof createOutletSchema>;

export const updateOutletSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    image: z.string().url().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk update",
});

export const updateOutletLocationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
});

export type UpdateOutletLocationInput = z.infer<typeof updateOutletLocationSchema>;
export type UpdateOutletInput = z.infer<typeof updateOutletSchema>;