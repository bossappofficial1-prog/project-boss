import { z } from "zod";
import { ProductType, ServiceStatus, MediaType, MediaSource } from "@prisma/client";

// Media item schema for product gallery (SERVICE only)
const mediaItemSchema = z.object({
  url: z.string().min(1, { message: "URL media wajib diisi" }),
  type: z.nativeEnum(MediaType),
  source: z.nativeEnum(MediaSource),
  alt: z.string().nullable().optional(),
  order: z.number().int().min(0).default(0),
  thumbnailUrl: z.string().nullable().optional(),
});

// ProductGoods
const productGoodsSchema = z.object({
  barcode: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  currentStock: z.number().int().min(0).optional(), // default di DB
  minStock: z.number().int().min(0).nullable().optional(),
  maxStock: z.number().int().min(0).nullable().optional(),
  unit: z.string().min(1, { message: "Unit wajib diisi" }),
  sellingPrice: z.number().positive({ message: "Harga jual harus > 0" }),
  averageHpp: z.number().positive({ message: "averageHpp harus > 0" }),
});

// ProductService - Base schema without refinement (for .partial() usage)
const productServiceBaseSchema = z.object({
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

  // Operating hours untuk setiap hari
  mondayOpen: z.coerce.date().nullable().optional(),
  mondayClose: z.coerce.date().nullable().optional(),
  tuesdayOpen: z.coerce.date().nullable().optional(),
  tuesdayClose: z.coerce.date().nullable().optional(),
  wednesdayOpen: z.coerce.date().nullable().optional(),
  wednesdayClose: z.coerce.date().nullable().optional(),
  thursdayOpen: z.coerce.date().nullable().optional(),
  thursdayClose: z.coerce.date().nullable().optional(),
  fridayOpen: z.coerce.date().nullable().optional(),
  fridayClose: z.coerce.date().nullable().optional(),
  saturdayOpen: z.coerce.date().nullable().optional(),
  saturdayClose: z.coerce.date().nullable().optional(),
  sundayOpen: z.coerce.date().nullable().optional(),
  sundayClose: z.coerce.date().nullable().optional(),
});

// ProductService - With refinement validation (for create)
const productServiceSchema = productServiceBaseSchema.refine(
  (data) => {
    // Validation: jika ada open time, maka close time juga harus ada (dan sebaliknya)
    // Validation: close time harus lebih besar dari open time
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    for (const day of days) {
      const open = (data as any)[`${day}Open`];
      const close = (data as any)[`${day}Close`];

      // Jika salah satu ada, keduanya harus ada
      if ((open && !close) || (!open && close)) {
        return false;
      }

      // Jika keduanya ada, close harus lebih besar dari open
      if (open && close && close <= open) {
        return false;
      }
    }
    return true;
  },
  {
    message: "Jam tutup harus lebih besar dari jam buka untuk setiap hari yang diset",
  },
);

// ProductTicket
const productTicketSchema = z.object({
  sellingPrice: z.number().positive({ message: "Harga jual harus > 0" }),
  eventDate: z.coerce.date({ required_error: "Tanggal event wajib diisi" }),
  eventEndDate: z.coerce.date().nullable().optional(),
  venue: z.string().min(1, { message: "Nama venue wajib diisi" }),
  venueAddress: z.string().nullable().optional(),
  mapUrl: z.string().url().nullable().optional(),
  totalQuota: z.number().int().min(1, { message: "Total kuota minimal 1" }),
  maxPerOrder: z.number().int().min(1).optional(),
  saleStartDate: z.coerce.date().nullable().optional(),
  saleEndDate: z.coerce.date().nullable().optional(),
  terms: z.string().nullable().optional(),
  codeFormat: z.enum(["QR_CODE", "BARCODE_128"]).default("QR_CODE").optional(),
  designConfig: z.record(z.any()).nullable().optional(),
});

/* =====================================================
 * BASE PRODUCT (PRISMA PRODUCT)
 * ===================================================== */

const baseProductSchema = {
  name: z.string().min(1, { message: "Nama produk tidak boleh kosong" }),
  description: z.string().optional(),
  status: z.nativeEnum(ServiceStatus).optional(),
  outletId: z.string(),
  image: z.string().optional(),
  taxPercentage: z.number().min(0).nullable().optional(),
  taxName: z.string().optional(),
};

export const createProductSchema = z.discriminatedUnion("type", [
  // GOODS
  z.object({
    ...baseProductSchema,
    type: z.literal(ProductType.GOODS),

    goods: productGoodsSchema,
    service: z.never().optional(),
    ticket: z.never().optional(),
    media: z.array(mediaItemSchema).max(5, { message: "Maksimal 5 media" }).optional(),
  }),

  // SERVICE
  z.object({
    ...baseProductSchema,
    type: z.literal(ProductType.SERVICE),

    service: productServiceSchema,
    goods: z.never().optional(),
    ticket: z.never().optional(),
    media: z.array(mediaItemSchema).max(5, { message: "Maksimal 5 media" }).optional(),
  }),

  // TICKET
  z.object({
    ...baseProductSchema,
    type: z.literal(ProductType.TICKET),

    ticket: productTicketSchema,
    goods: z.never().optional(),
    service: z.never().optional(),
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
      taxPercentage: z.number().min(0).nullable().optional(),
      taxName: z.string().optional(),

      goods: productGoodsSchema.partial().optional(),
      service: z.never().optional(),
      ticket: z.never().optional(),
      media: z.array(mediaItemSchema).max(5, { message: "Maksimal 5 media" }).optional(),
    }),

    // SERVICE
    z.object({
      type: z.literal(ProductType.SERVICE).optional(),

      name: z.string().optional(),
      description: z.string().optional(),
      status: z.nativeEnum(ServiceStatus).optional(),
      image: z.string().optional(),
      taxPercentage: z.number().min(0).nullable().optional(),
      taxName: z.string().optional(),

      // Use base schema without refinement for partial updates
      service: productServiceBaseSchema.partial().optional(),
      goods: z.never().optional(),
      ticket: z.never().optional(),
      media: z.array(mediaItemSchema).max(5, { message: "Maksimal 5 media" }).optional(),
    }),

    // TICKET
    z.object({
      type: z.literal(ProductType.TICKET),

      name: z.string().optional(),
      description: z.string().optional(),
      status: z.nativeEnum(ServiceStatus).optional(),
      image: z.string().optional(),
      taxPercentage: z.number().min(0).nullable().optional(),
      taxName: z.string().optional(),

      ticket: productTicketSchema.partial().optional(),
      goods: z.never().optional(),
      service: z.never().optional(),
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
