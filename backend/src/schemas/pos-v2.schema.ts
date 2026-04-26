import { z } from "zod";

const posV2ItemSchema = z.object({
    productId: z.string().min(1, { message: "Product ID wajib diisi" }),
    quantity: z
        .number()
        .int({ message: "Quantity harus bilangan bulat" })
        .min(1, { message: "Quantity minimal 1" })
        .max(1000, { message: "Quantity maksimal 1000" }),
});

export const createPosV2OrderSchema = z.object({
    customer: z.object({
        name: z
            .string()
            .min(1, { message: "Nama pelanggan wajib diisi" })
            .max(100, { message: "Nama maksimal 100 karakter" }),
        phone: z
            .string()
            .min(8, { message: "Nomor telepon minimal 8 digit" })
            .max(15, { message: "Nomor telepon maksimal 15 digit" })
            .regex(/^[0-9+\-\s()]+$/, { message: "Format nomor telepon tidak valid" }),
    }),
    outletId: z.string().min(1, { message: "Outlet ID wajib" }),
    items: z
        .array(posV2ItemSchema)
        .min(1, { message: "Minimal 1 item dalam pesanan" })
        .max(50, { message: "Maksimal 50 item berbeda" }),
    paymentMethod: z.enum(["cash", "qris", "none"]).optional(),
    cashReceived: z
        .number()
        .min(0, { message: "Nominal cash tidak boleh negatif" })
        .optional(),
    tableId: z.string().uuid().optional(),
    tableNumber: z.string().optional(),
    isOpenBill: z.boolean().optional().default(false),
    notes: z.string().max(500).optional(),
    // Service booking fields
    bookingSlotId: z.string().uuid().optional(),
    bookingDate: z.string().datetime().optional(),
    staffId: z.string().uuid().optional(),
    pointsRedeemed: z.number().int().min(0).optional(),
    existingOrderId: z.string().optional(),
});

export type CreatePosV2OrderInput = z.infer<typeof createPosV2OrderSchema>;
