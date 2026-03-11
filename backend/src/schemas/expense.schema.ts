import { z } from "zod";

export const createExpenseSchema = z.object({
  cashier: z.string().optional(),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  amount: z.number().positive("Jumlah harus lebih dari 0"),
  date: z.string().datetime("Format tanggal tidak valid"),
  outletId: z.string(),
  receiptUrl: z.string().url().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();
