import { z } from "zod";

const manualItemSchema = z.object({
  productId: z.string().uuid({ message: "Product ID tidak valid" }),
  quantity: z.number().int().min(1, { message: "Quantity minimal 1" }),
  bookingDate: z
    .string()
    .datetime({ message: "Format tanggal booking tidak valid" })
    .optional(),
});

export const createManualTransactionSchema = z.object({
  outletId: z.string(),
  transactionDate: z
    .string()
    .datetime({ message: "Format tanggal tidak valid" }),
  customerName: z.string().max(100).optional(),
  customerPhone: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, { message: "Format nomor telepon tidak valid" })
    .optional(),
  amount: z.number().positive({ message: "Jumlah harus lebih dari 0" }).optional(),
  items: z.array(manualItemSchema).min(1, { message: "Minimal 1 item" }),
});

export const updateManualTransactionSchema = z
  .object({
    transactionDate: z
      .string()
      .datetime({ message: "Format tanggal tidak valid" })
      .optional(),
    customerName: z.string().max(100).optional(),
    customerPhone: z
      .string()
      .regex(/^[0-9+\-\s()]+$/, { message: "Format nomor telepon tidak valid" })
      .optional(),
    amount: z
      .number()
      .positive({ message: "Jumlah harus lebih dari 0" })
      .optional(),
    items: z
      .array(manualItemSchema)
      .min(1, { message: "Minimal 1 item" })
      .optional(),
  })
  .refine(
    (data) =>
      Object.keys(data).some(
        (key) => data[key as keyof typeof data] !== undefined,
      ),
    { message: "Minimal satu field harus diisi" },
  );

export const deleteManualTransactionSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type CreateManualTransactionInput = z.infer<
  typeof createManualTransactionSchema
>;
export type UpdateManualTransactionInput = z.infer<
  typeof updateManualTransactionSchema
>;
