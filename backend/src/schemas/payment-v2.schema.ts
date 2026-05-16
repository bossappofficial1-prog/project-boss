import z from "zod";
import { paymentMethod } from "../constants/payment-method";

const paymentMethodIds = paymentMethod.map((p) => p.id) as [string, ...string[]];

export const CreatePaymentSchema = z.object({
  guestCustomer: z.object({
    name: z.string().min(1, "Nama tidak boleh kosong"),
    phone: z
      .string()
      .regex(/^[0-9]+$/, "Nomor telepon hanya boleh angka")
      .min(8, "Nomor telepon minimal 8 digit")
      .max(15, "Nomor telepon maksimal 15 digit"),
  }),
  items: z.array(
    z.object({
      productId: z.string().min(1, "ProductId wajib diisi"),
      quantity: z.number().min(1, "Quantity minimal 1"),
    }),
  ),
  paymentMethod: z.enum(["qris", "online", "cash"]),
  onlinePaymentChannel: z.enum(paymentMethodIds).optional(),
  bookingSlotId: z.string().optional(),
  staffId: z.string().uuid().optional(),
  outletId: z.string(),
  tableId: z.string().uuid().optional(),
  tableNumber: z.string().optional(),
});

export type CreatePaymentPayload = z.infer<typeof CreatePaymentSchema>;
