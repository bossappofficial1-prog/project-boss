import { z } from 'zod';

export const createExpenseSchema = z.object({
    description: z.string().min(1, 'Deskripsi wajib diisi'),
    amount: z.number().positive('Jumlah harus lebih dari 0'),
    date: z.string().datetime('Format tanggal tidak valid'),
    outletId: z.string(),
});

export const updateExpenseSchema = createExpenseSchema.partial();
