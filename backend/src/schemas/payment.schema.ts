import { z } from "zod";

const itemDetailSchema = z.object({
    productId: z.string().uuid({ message: "Product ID harus berupa UUID yang valid" }),
    quantity: z.number()
        .int({ message: "Quantity harus berupa bilangan bulat" })
        .min(1, { message: "Quantity minimal 1" })
        .max(1000, { message: "Quantity maksimal 1000" }),
    outletId: z.string().uuid({ message: "Outlet ID harus berupa UUID yang valid" }),
});

export const createPaymentSchema = z.object({
    customer_details: z.object({
        name: z.string()
            .min(2, { message: "Nama minimal 2 karakter" })
            .max(100, { message: "Nama maksimal 100 karakter" })
            .regex(/^[a-zA-Z\s]+$/, { message: "Nama hanya boleh mengandung huruf dan spasi" }),
        phone: z.string()
            .min(10, { message: "Nomor telepon minimal 10 digit" })
            .max(15, { message: "Nomor telepon maksimal 15 digit" })
            .regex(/^[0-9+\-\s()]+$/, { message: "Format nomor telepon tidak valid" }),
    }),
    item_details: z.array(itemDetailSchema)
        .min(1, { message: "Pembayaran harus memiliki minimal 1 item" })
        .max(50, { message: "Pembayaran maksimal 50 item berbeda" }),
    paymentMethod: z.enum(["qris", "bca-va", "bni-va", "bri-va", "mandiri-va", "permata-va"], {
        errorMap: () => ({ message: "Payment method tidak valid" })
    }).default("qris"),
}).refine(
    (data) => {
        // Validate total quantity doesn't exceed reasonable limits
        const totalQuantity = data.item_details.reduce((sum, item) => sum + item.quantity, 0);
        return totalQuantity <= 10000;
    },
    {
        message: "Total quantity semua item tidak boleh melebihi 10.000",
        path: ["item_details"]
    }
)
    .refine(
        (data) => {
            // Validate all items have the same outlet
            const outletIds = data.item_details.map(item => item.outletId);
            const uniqueOutletIds = new Set(outletIds);
            return uniqueOutletIds.size === 1;
        },
        {
            message: "Semua item harus dari outlet yang sama",
            path: ["item_details"]
        }
    );

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
