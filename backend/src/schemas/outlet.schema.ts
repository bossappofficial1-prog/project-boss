import { z } from "zod";

export const createOutletSchema = z.object({
    name: z.string().nonempty({ message: "Nama outlet tidak boleh kosong" }),
    address: z.string().optional(),
    phone: z.string().optional(),
    image: z.string().url().optional(),
    businessId: z.string().nonempty({ message: "ID Bisnis tidak boleh kosong" }),
});

export type CreateOutletInput = z.infer<typeof createOutletSchema>;

export const updateOutletSchema = z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    image: z.string().url().optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk update",
});

export type UpdateOutletInput = z.infer<typeof updateOutletSchema>;