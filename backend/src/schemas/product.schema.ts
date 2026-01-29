import { z } from "zod";
import { ProductType, ServiceStatus } from "@prisma/client";

// Base schema for all products
const baseProductSchema = z.object({
  name: z.string().nonempty({ message: "Nama produk tidak boleh kosong" }),
  description: z.string().optional(),
  type: z.nativeEnum(ProductType),
  status: z.nativeEnum(ServiceStatus).default(ServiceStatus.ACTIVE),
  outletId: z.string().nonempty({ message: "ID Outlet tidak boleh kosong" }),
});

// Schema for GOODS-specific fields
const goodsFieldsSchema = z.object({
  currentStock: z.number().int().min(0, { message: "Stok harus >= 0" }),
  minStock: z.number().int().min(0).optional(),
  unit: z.string().nonempty({ message: "Satuan tidak boleh kosong" }),
  averageHpp: z.number().min(0, { message: "HPP harus >= 0" }),
  sellingPrice: z.number().positive({ message: "Harga jual harus > 0" }),
});

// Schema for SERVICE-specific fields
const serviceFieldsSchema = z.object({
  durationMinutes: z.number().int().min(1, { message: "Durasi minimal 1 menit" }),
  sellingPrice: z.number().positive({ message: "Harga jual harus > 0" }),
  providerName: z.string().nonempty({ message: "Nama provider tidak boleh kosong" }),
  providerPhone: z.string().optional(),
  providerEmail: z.string().email({ message: "Email tidak valid" }).optional(),
  commissionType: z.enum(["PERCENTAGE", "FIXED"], {
    message: "Tipe komisi: PERCENTAGE atau FIXED",
  }),
  commissionValue: z.number().min(0, { message: "Nilai komisi harus >= 0" }),
  maxParallel: z.number().int().min(1, { message: "Maksimal paralel minimal 1" }).default(1),
});

// Discriminated union for create
export const createProductSchema = z.discriminatedUnion("type", [
  z.object({
    ...baseProductSchema.shape,
    type: z.literal(ProductType.GOODS),
    goods: goodsFieldsSchema,
  }),
  z.object({
    ...baseProductSchema.shape,
    type: z.literal(ProductType.SERVICE),
    service: serviceFieldsSchema,
  }),
]);

export type CreateProductInput = z.infer<typeof createProductSchema>;

// Update schemas - can update base fields or subtable fields
const baseUpdateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.nativeEnum(ServiceStatus).optional(),
});

const goodsUpdateSchema = z.object({
  currentStock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  averageHpp: z.number().min(0).optional(),
  sellingPrice: z.number().positive().optional(),
});

const serviceUpdateSchema = z.object({
  durationMinutes: z.number().int().min(1).optional(),
  sellingPrice: z.number().positive().optional(),
  providerName: z.string().optional(),
  providerPhone: z.string().optional(),
  providerEmail: z.string().email().optional(),
  commissionType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  commissionValue: z.number().min(0).optional(),
  maxParallel: z.number().int().min(1).optional(),
});

// Update can be discriminated by type or just update common fields
export const updateProductSchema = z
  .object({
    base: baseUpdateSchema.optional(),
    goods: goodsUpdateSchema.optional(),
    service: serviceUpdateSchema.optional(),
  })
  .refine(
    (data) => {
      // At least one field must be provided
      return Object.keys(data).some((key) => data[key as keyof typeof data] !== undefined);
    },
    {
      message: "Minimal satu field harus diisi untuk update",
    },
  );

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
