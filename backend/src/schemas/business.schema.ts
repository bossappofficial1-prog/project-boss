import { z } from "zod";

export const createBusinessSchema = z.object({
    name: z.string().nonempty({ message: "Nama bisnis tidak boleh kosong" }),
    description: z.string().optional(),
    bankName: z.string(),
    bankAccount: z.string(),
    accountHolder: z.string(),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;

export const updateBusinessSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    bankName: z.string().optional(),
    bankAccount: z.string().optional(),
    accountHolder: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk update",
});

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;