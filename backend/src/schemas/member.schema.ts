import { z } from "zod";

export const createMemberSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
  phone: z
    .string()
    .min(10, "Nomor telepon minimal 10 digit")
    .max(15, "Nomor telepon terlalu panjang")
    .regex(/^[0-9+]+$/, "Nomor telepon hanya boleh angka dan +"),
  email: z.string().email("Format email tidak valid").optional().nullable().or(z.literal("")),
});

export const updateMemberSchema = createMemberSchema.partial();

export const increasePointSchema = z.object({
  point: z.number().int("Point harus bilangan bulat").positive("Point harus lebih dari 0"),
  orderId: z.string().min(1, "Order ID wajib diisi"),
});

export const getMembersByOutletQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type IncreasePointInput = z.infer<typeof increasePointSchema>;
export type GetMembersByOutletQuery = z.infer<typeof getMembersByOutletQuerySchema>;
