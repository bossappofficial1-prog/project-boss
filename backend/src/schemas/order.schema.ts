import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const onlinePaymentChannelSchema = z.enum(["qris_dynamic", "va_bca", "ewallet_gopay"]);

const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z
    .number()
    .int({ message: "Quantity harus berupa bilangan bulat" })
    .min(1, { message: "Quantity minimal 1" })
    .max(1000, { message: "Quantity maksimal 1000" }),
});

const phoneSchema = z
  .string()
  .min(10, { message: "Nomor telepon minimal 10 digit" })
  .max(15, { message: "Nomor telepon maksimal 15 digit" })
  .regex(/^[0-9+\-\s()]+$/, { message: "Format nomor telepon tidak valid" });

export const createOrderSchema = z
  .object({
    guestCustomer: z.object({
      name: z
        .string()
        .min(2, { message: "Nama minimal 2 karakter" })
        .max(100, { message: "Nama maksimal 100 karakter" })
        .regex(/^[a-zA-Z\s]+$/, { message: "Nama hanya boleh mengandung huruf dan spasi" }),
      phone: phoneSchema,
    }),
    outletId: z.string(),
    items: z
      .array(orderItemSchema)
      .min(1, { message: "Pesanan harus memiliki minimal 1 item" })
      .max(50, { message: "Pesanan maksimal 50 item berbeda" }),
    bookingDate: z.string().datetime().optional(),
    paymentMethod: z
      .enum(["qris", "online", "cash"], {
        errorMap: () => ({ message: "Payment method harus 'qris', 'online', atau 'cash'" }),
      })
      .default("online"),
    onlinePaymentChannel: onlinePaymentChannelSchema.optional(),
    bookingSlotId: z.string().uuid().optional(),
    staffId: z.string().uuid().optional(),
    cashierId: z.string().uuid().optional(),
    orderSource: z.enum(["CUSTOMER", "POS"]).default("CUSTOMER"),
    tableNumber: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validate total quantity doesn't exceed reasonable limits
      const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
      return totalQuantity <= 10000;
    },
    {
      message: "Total quantity semua item tidak boleh melebihi 10.000",
      path: ["items"],
    },
  )
  .refine(
    (data) => {
      // Validate unique product IDs
      const productIds = data.items.map((item) => item.productId);
      const uniqueProductIds = new Set(productIds);
      return productIds.length === uniqueProductIds.size;
    },
    {
      message: "Tidak boleh ada produk yang duplikat dalam satu order",
      path: ["items"],
    },
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
      path: ["bookingDate"],
    },
  )
  .refine(
    (data) => {
      if (data.paymentMethod === "online") {
        return Boolean(data.onlinePaymentChannel);
      }
      return true;
    },
    {
      message: "Online payment channel wajib diisi untuk pembayaran online",
      path: ["onlinePaymentChannel"],
    },
  )
  .refine(
    (data) => {
      if (data.bookingSlotId) {
        return Boolean(data.staffId);
      }
      if (data.staffId) {
        return Boolean(data.bookingSlotId);
      }
      return true;
    },
    {
      message: "Staff wajib dipilih ketika menggunakan slot booking",
      path: ["staffId"],
    },
  );

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OnlinePaymentChannel = z.infer<typeof onlinePaymentChannelSchema>;

export const updateOrderStatusSchema = z
  .object({
    status: z.nativeEnum(OrderStatus),
    reason: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === OrderStatus.CANCELLED && !data.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Alasan pembatalan wajib diisi",
        path: ["reason"],
      });
    }
  });

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

const serviceQueueStatuses = [
  OrderStatus.AWAITING_PAYMENT,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.READY,
  OrderStatus.ON_GOING,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
] as const;

export const updateServiceQueueStatusSchema = z
  .object({
    status: z.enum(
      serviceQueueStatuses.map((status) => status) as [
        (typeof serviceQueueStatuses)[number],
        ...(typeof serviceQueueStatuses)[number][],
      ],
    ),
    reason: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === OrderStatus.CANCELLED && !data.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Alasan pembatalan wajib diisi",
        path: ["reason"],
      });
    }
  });

export type UpdateServiceQueueStatusInput = z.infer<typeof updateServiceQueueStatusSchema>;

export const customerCancelOrderSchema = z.object({
  phone: phoneSchema,
  reason: z.string().max(250).optional(),
});

export const customerConfirmOrderSchema = z.object({
  phone: phoneSchema,
});

export type CustomerCancelOrderInput = z.infer<typeof customerCancelOrderSchema>;
export type CustomerConfirmOrderInput = z.infer<typeof customerConfirmOrderSchema>;
