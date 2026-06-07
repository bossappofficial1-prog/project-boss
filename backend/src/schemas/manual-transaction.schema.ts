import { z } from "zod";

export const createManualTransactionSchema = z.object({
  outletId: z.string().uuid({ message: "Outlet ID tidak valid" }),
  transactionDate: z.string().datetime({ message: "Format tanggal tidak valid" }),
  customerName: z.string().max(100).optional(),
  customerPhone: z.string().regex(/^[0-9+\-\s()]+$/, { message: "Format nomor telepon tidak valid" }).optional(),
  amount: z.number().positive({ message: "Jumlah harus lebih dari 0" }),
  items: z.array(z.object({
    productId: z.string().uuid({ message: "Product ID tidak valid" }),
    quantity: z.number().int().min(1, { message: "Quantity minimal 1" }),
    bookingDate: z.string().datetime({ message: "Format tanggal booking tidak valid" }).optional(),
  })).min(1, { message: "Minimal 1 item" }),
});

export type CreateManualTransactionInput = z.infer<typeof createManualTransactionSchema>;