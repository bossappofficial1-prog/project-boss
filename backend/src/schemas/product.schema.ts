import { z } from "zod";
import { ProductType, ServiceStatus } from "@prisma/client";

/* =====================================================
 * SUB SCHEMA (SESUAI SUBTABLE PRISMA)
 * ===================================================== */

// ProductGoods
const productGoodsSchema = z.object({
  currentStock: z.number().int().min(0).optional(), // default di DB
  minStock: z.number().int().min(0).nullable().optional(),
  unit: z.string().min(1, { message: "Unit wajib diisi" }),
  sellingPrice: z.number().positive({ message: "Harga jual harus > 0" }),
  averageHpp: z.number().positive({ message: "averageHpp harus > 0" }),
});

// ProductService
const productServiceSchema = z.object({
  durationMinutes: z.number().int().positive({ message: "Durasi layanan wajib diisi" }),
  sellingPrice: z.number().positive({ message: "Harga jual harus > 0" }),

  providerName: z.string().min(1, { message: "Nama provider wajib diisi" }),
  providerPhone: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.string().optional(),
  ),
  providerEmail: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.string().email().optional(),
  ),

  commissionType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  commissionValue: z.number().min(0).optional(),

  maxParallel: z.number().int().min(1).optional(),

  bookingInWorkHours: z.boolean().default(true).optional(),
});

/* =====================================================
 * BASE PRODUCT (PRISMA PRODUCT)
 * ===================================================== */

const baseProductSchema = {
  name: z.string().min(1, { message: "Nama produk tidak boleh kosong" }),
  description: z.string().optional(),
  status: z.nativeEnum(ServiceStatus).optional(),
  outletId: z.string().uuid({ message: "Outlet ID tidak valid" }),
  image: z.string().optional(),
};

/* =====================================================
 * CREATE PRODUCT
 * ===================================================== */

export const createProductSchema = z.discriminatedUnion("type", [
  // GOODS
  z.object({
    ...baseProductSchema,
    type: z.literal(ProductType.GOODS),

    goods: productGoodsSchema,
    service: z.never().optional(),
  }),

  // SERVICE
  z.object({
    ...baseProductSchema,
    type: z.literal(ProductType.SERVICE),

    service: productServiceSchema,
    goods: z.never().optional(),
  }),
]);

export type CreateProductInput = z.infer<typeof createProductSchema>;

/* =====================================================
 * UPDATE PRODUCT
 * ===================================================== */

export const updateProductSchema = z
  .discriminatedUnion("type", [
    // GOODS
    z.object({
      type: z.literal(ProductType.GOODS),

      name: z.string().optional(),
      description: z.string().optional(),
      status: z.nativeEnum(ServiceStatus).optional(),
      image: z.string().optional(),

      goods: productGoodsSchema.partial().optional(),
      service: z.never().optional(),
    }),

    // SERVICE
    z.object({
      type: z.literal(ProductType.SERVICE).optional(),

      name: z.string().optional(),
      description: z.string().optional(),
      status: z.nativeEnum(ServiceStatus).optional(),
      image: z.string().optional(),

      service: productServiceSchema.partial().optional(),
      goods: z.never().optional(),
    }),
  ])
  .refine(
    (data) => {
      // minimal ada satu field selain type
      const { type, ...rest } = data;
      return Object.keys(rest).length > 0;
    },
    {
      message: "Minimal satu field harus diisi untuk update",
    },
  );

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
