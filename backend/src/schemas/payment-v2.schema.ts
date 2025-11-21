import z from "zod";
import { paymentMethod } from "../constants/payment-method";

const paymentMethodIds = paymentMethod.map(p => p.id) as [string, ...string[]]

export const CreatePaymentSchema = z.object({
    customer_details: z.object({
        name: z.string().min(1, "Nama tidak boleh kosong"),
        phone: z.string()
            .regex(/^[0-9]+$/, "Nomor telepon hanya boleh angka")
            .min(8, "Nomor telepon minimal 8 digit")
            .max(15, "Nomor telepon maksimal 15 digit")
    }),
    item_details: z.array(
        z.object({
            productId: z.string().min(1, "ProductId wajib diisi"),
            quantity: z.number().min(1, "Quantity minimal 1")
        })
    ),
    payment_method: z.enum(paymentMethodIds),
    selectedSlotId: z.string().optional(),
    staffId: z.string().uuid().optional(),
    outletId: z.string()
})

export type CreatePaymentPayload = z.infer<typeof CreatePaymentSchema>