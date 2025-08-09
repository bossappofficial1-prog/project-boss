import { z } from "zod";
import { OrderStatus } from "@prisma/client";

const orderItemSchema = z.object({
    productId: z.string(),
    quantity: z.number()
        .int({ message: "Quantity harus berupa bilangan bulat" })
        .min(1, { message: "Quantity minimal 1" })
        .max(1000, { message: "Quantity maksimal 1000" }),
});

export const createOrderSchema = z.object({
    guestCustomer: z.object({
        name: z.string()
            .min(2, { message: "Nama minimal 2 karakter" })
            .max(100, { message: "Nama maksimal 100 karakter" })
            .regex(/^[a-zA-Z\s]+$/, { message: "Nama hanya boleh mengandung huruf dan spasi" }),
        phone: z.string()
            .min(10, { message: "Nomor telepon minimal 10 digit" })
            .max(15, { message: "Nomor telepon maksimal 15 digit" })
            .regex(/^[0-9+\-\s()]+$/, { message: "Format nomor telepon tidak valid" }),
    }),
    outletId: z.string(),
    items: z.array(orderItemSchema)
        .min(1, { message: "Pesanan harus memiliki minimal 1 item" })
        .max(50, { message: "Pesanan maksimal 50 item berbeda" }),
    bookingDate: z.string().datetime().optional(),
    paymentMethod: z.enum(["qris", "online"], {
        errorMap: () => ({ message: "Payment method harus 'qris' atau 'online'" })
    }).default("online"),
    bookingSlotId: z.string().uuid().optional(),
}).refine(
    (data) => {
        // Validate total quantity doesn't exceed reasonable limits
        const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
        return totalQuantity <= 10000;
    },
    {
        message: "Total quantity semua item tidak boleh melebihi 10.000",
        path: ["items"]
    }
).refine(
    (data) => {
        // Validate unique product IDs
        const productIds = data.items.map(item => item.productId);
        const uniqueProductIds = new Set(productIds);
        return productIds.length === uniqueProductIds.size;
    },
    {
        message: "Tidak boleh ada produk yang duplikat dalam satu order",
        path: ["items"]
    }
)
    .refine(
        (data) => {
            if (data.bookingSlotId && !data.bookingDate) {
                return false;
            }
            return true;
        },
        {
            message: "Booking slot harus punya tanggal booking",
            path: ["bookingDate"]
        }
    );

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
    status: z.nativeEnum(OrderStatus),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;