import { z } from "zod";

export const createOutletSchema = z.object({
    name: z.string().nonempty({ message: "Nama outlet tidak boleh kosong" }),
    description: z.string().optional(),
    address: z.string(),
    phone: z.string(),
    instagramUrl: z.string().optional(),
    email: z.string().email({ message: "Format email tidak valid" }).optional().or(z.literal("")),
    image: z.string().url().optional(),
    businessId: z.string().nonempty({ message: "ID Bisnis tidak boleh kosong" }),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    isOpen: z.boolean().default(true),
    type: z.enum(["FNB", "RETAIL", "EVENT", "SERVICE", "CUSTOM"]).optional().default("CUSTOM")
});

export type CreateOutletInput = z.infer<typeof createOutletSchema>;

export const updateOutletSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    instagramUrl: z.string().optional(),
    email: z.string().email({ message: "Format email tidak valid" }).optional().or(z.literal("")),
    image: z.string().url().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    isOpen: z.boolean().default(true).optional(),
    manualQrImageUrl: z.string().url().optional(),
    type: z.enum(["FNB", "RETAIL", "EVENT", "SERVICE", "CUSTOM"]).optional()
}).refine(data => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk update",
});

export const updateOutletLocationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
});

export type UpdateOutletLocationInput = z.infer<typeof updateOutletLocationSchema>;
export type UpdateOutletInput = z.infer<typeof updateOutletSchema>;