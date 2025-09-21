import { z } from "zod";
import { ProductType, ServiceStatus, FeeBearer } from "@prisma/client";

export const createProductSchema = z.object({
    name: z.string().nonempty({ message: "Nama produk tidak boleh kosong" }),
    description: z.string().optional(),
    price: z.number().positive({ message: "Harga harus lebih dari 0" }),
    costPrice: z.number().min(0).default(0),
    type: z.nativeEnum(ProductType),
    quantity: z.number().int().min(0).optional(),
    unit: z.string().optional(),
    status: z.nativeEnum(ServiceStatus).default(ServiceStatus.ACTIVE),
    transactionFeeBearer: z.nativeEnum(FeeBearer).optional(),
    serviceDurationMinutes: z.number().int().min(0).optional(),
    outletId: z.string().nonempty({ message: "ID Outlet tidak boleh kosong" }),
    image: z.string({ message: "URL gambar tidak valid" }).optional(),
    capacity: z.number().min(-1).optional()
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.number().positive({ message: "Harga harus lebih dari 0" }).optional(),
    costPrice: z.number().min(0).optional(),
    type: z.nativeEnum(ProductType).optional(),
    quantity: z.number().int().min(0).optional(),
    unit: z.string().optional(),
    status: z.nativeEnum(ServiceStatus).optional(),
    transactionFeeBearer: z.nativeEnum(FeeBearer).optional(),
    serviceDurationMinutes: z.number().int().min(0).optional(),
    image: z.string({ message: "URL gambar tidak valid" }).optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk update",
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;