"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productApi, uploadApi } from "@/lib/api";
import { gooeyToast } from "goey-toast";
import z from "zod";
import {
  type CreateProductPayload,
  type UpdateProductPayload,
} from "@/lib/apis/product";

// ==========================================
// Schemas and Types
// ==========================================

const ProductStatus = z.enum(["ACTIVE", "INACTIVE"]);

const baseSchema = z.object({
  name: z.string().min(2, "Nama produk minimal 2 karakter"),
  description: z.string().optional(),
  status: ProductStatus,
  categoryId: z.string().nullable().optional(),
  taxPercentage: z.coerce.number().min(0).nullable().optional(),
  taxName: z.string().optional(),
  file: z
    .union([
      z
        .instanceof(File)
        .refine((f) => f.size <= 3 * 1024 * 1024, "Maksimal 3MB"),
      z.string(),
    ])
    .optional(),
});

const parseDate = (date: string | Date | null | undefined): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return date;
  return new Date(date);
};

const goodsSchema = z.object({
  currentStock: z.coerce.number().min(0, "Stok minimal 0"),
  minStock: z.coerce.number().min(0).nullable().optional(),
  maxStock: z.coerce.number().min(0).nullable().optional(),
  unit: z.string().min(1, "Unit wajib diisi"),
  sellingPrice: z.coerce.number().min(1, "Harga jual harus > 0"),
  averageHpp: z.coerce.number().min(1, "HPP harus > 0"),
  barcode: z.string().optional().or(z.literal("")),
  sku: z.string().optional().or(z.literal("")),
});

export type GoodsSchemaType = z.infer<typeof goodsSchema>;

const serviceSchema = z.object({
  durationMinutes: z.coerce.number().min(1, "Durasi wajib diisi"),
  sellingPrice: z.coerce.number().min(1, "Harga wajib diisi"),
  providerName: z.string().min(1, "Nama provider wajib diisi"),
  providerPhone: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().optional(),
  ),
  providerEmail: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().email().optional(),
  ),
  commissionType: z.enum(["PERCENTAGE", "FIXED"]),
  commissionValue: z.coerce.number().min(0),
  bookingInWorkHours: z.boolean().default(true),

  // Operating hours (nullable)
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

export type ServiceSchemaType = z.infer<typeof serviceSchema>;

const ticketSchema = z.object({
  sellingPrice: z.coerce.number().min(1, "Harga tiket harus > 0"),
  eventDate: z.coerce.date("Tanggal event wajib diisi"),
  eventEndDate: z.coerce.date().nullable().optional(),
  venue: z.string().min(1, "Nama venue wajib diisi"),
  venueAddress: z.string().nullable().optional(),
  mapUrl: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().url().nullable().optional(),
  ),
  totalQuota: z.coerce.number().min(1, "Total kuota minimal 1"),
  maxPerOrder: z.coerce.number().min(1).optional(),
  saleStartDate: z.coerce.date().nullable().optional(),
  saleEndDate: z.coerce.date().nullable().optional(),
  terms: z.string().nullable().optional(),
  codeFormat: z.enum(["QR_CODE", "BARCODE_128"]).default("QR_CODE"),
  designConfig: z
    .object({
      primaryColor: z.string().optional(),
      backgroundColor: z.string().optional(),
      layoutType: z.string().optional(),
    })
    .nullable()
    .optional(),
});

export type TicketSchemaType = z.infer<typeof ticketSchema>;

export const productSchema = z.discriminatedUnion("type", [
  baseSchema.extend({
    type: z.literal("GOODS"),
    goods: goodsSchema,
    service: z.preprocess(() => undefined, z.undefined().optional()),
    ticket: z.preprocess(() => undefined, z.undefined().optional()),
  }),
  baseSchema.extend({
    type: z.literal("SERVICE"),
    service: serviceSchema,
    goods: z.preprocess(() => undefined, z.undefined().optional()),
    ticket: z.preprocess(() => undefined, z.undefined().optional()),
  }),
  baseSchema.extend({
    type: z.literal("TICKET"),
    ticket: ticketSchema,
    goods: z.preprocess(() => undefined, z.undefined().optional()),
    service: z.preprocess(() => undefined, z.undefined().optional()),
  }),
]);

export type ProductFormValues = z.infer<typeof productSchema>;

// ==========================================
// TanStack Query Mutations
// ==========================================

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => productApi.create(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["products", variables.outletId],
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateProductPayload;
    }) => productApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
    },
  });
}

// ==========================================
// Custom Form Submit Hook
// ==========================================

export interface UseProductFormSubmitProps {
  form: any; // UseFormReturn<ProductFormValues>
  outletId?: string | null;
  action: "add" | "edit";
  productId?: string | null;
  onSuccess?: () => void;
  onClose?: () => void;
}

export function useProductFormSubmit({
  form,
  outletId,
  action,
  productId,
  onSuccess,
  onClose,
}: UseProductFormSubmitProps) {
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async () => {
    const values = form.getValues() as ProductFormValues;
    const file = values.file instanceof File ? values.file : null;

    let uploadedImageUrl = undefined;
    try {
      // 1. Upload image if a new one is selected
      if (file) {
        const uploaded = await uploadApi.uploadImage(file, {
          scope: "product",
        });
        uploadedImageUrl = uploaded.url;
      }

      // 2. Format base payload
      const basePayload = {
        name: values.name,
        description: values.description || undefined,
        status: values.status,
        categoryId: values.categoryId || null,
        taxPercentage: values.taxPercentage,
        taxName: values.taxName || undefined,
        image:
          uploadedImageUrl ||
          (typeof values.file === "string" ? values.file : undefined),
      };

      if (action === "add") {
        if (!outletId) throw new Error("Outlet ID is required");

        let payload: CreateProductPayload = {
          ...basePayload,
          type: values.type,
          outletId,
        };

        if (values.type === "GOODS" && values.goods) {
          payload.goods = {
            averageHpp: values.goods.averageHpp,
            currentStock: values.goods.currentStock,
            sellingPrice: values.goods.sellingPrice,
            unit: values.goods.unit,
            minStock: values.goods.minStock,
            maxStock: values.goods.maxStock,
            barcode: values.goods.barcode || undefined,
            sku: values.goods.sku || undefined,
          };
        } else if (values.type === "SERVICE" && values.service) {
          payload.service = {
            durationMinutes: values.service.durationMinutes,
            sellingPrice: values.service.sellingPrice,
            providerName: values.service.providerName,
            providerPhone: values.service.providerPhone,
            providerEmail: values.service.providerEmail,
            commissionType: values.service.commissionType,
            commissionValue: values.service.commissionValue,
            bookingInWorkHours: values.service.bookingInWorkHours,
            mondayOpen: parseDate(values.service.mondayOpen),
            mondayClose: parseDate(values.service.mondayClose),
            tuesdayOpen: parseDate(values.service.tuesdayOpen),
            tuesdayClose: parseDate(values.service.tuesdayClose),
            wednesdayOpen: parseDate(values.service.wednesdayOpen),
            wednesdayClose: parseDate(values.service.wednesdayClose),
            thursdayOpen: parseDate(values.service.thursdayOpen),
            thursdayClose: parseDate(values.service.thursdayClose),
            fridayOpen: parseDate(values.service.fridayOpen),
            fridayClose: parseDate(values.service.fridayClose),
            saturdayOpen: parseDate(values.service.saturdayOpen),
            saturdayClose: parseDate(values.service.saturdayClose),
            sundayOpen: parseDate(values.service.sundayOpen),
            sundayClose: parseDate(values.service.sundayClose),
          };
        } else if (values.type === "TICKET" && values.ticket) {
          payload.ticket = {
            sellingPrice: values.ticket.sellingPrice,
            eventDate: values.ticket.eventDate,
            eventEndDate: values.ticket.eventEndDate,
            venue: values.ticket.venue,
            venueAddress: values.ticket.venueAddress,
            mapUrl: values.ticket.mapUrl,
            totalQuota: values.ticket.totalQuota,
            maxPerOrder: values.ticket.maxPerOrder,
            saleStartDate: values.ticket.saleStartDate,
            saleEndDate: values.ticket.saleEndDate,
            terms: values.ticket.terms,
            codeFormat: values.ticket.codeFormat,
            designConfig: values.ticket.designConfig,
          };
        }

        await createMutation.mutateAsync(payload);
        gooeyToast.success("Produk berhasil ditambahkan");
      } else {
        if (!productId) throw new Error("Product ID is required for updating");

        let payload: UpdateProductPayload = {
          ...basePayload,
          type: values.type,
        };

        if (values.type === "GOODS" && values.goods) {
          payload.goods = {
            averageHpp: values.goods.averageHpp,
            currentStock: values.goods.currentStock,
            sellingPrice: values.goods.sellingPrice,
            unit: values.goods.unit,
            minStock: values.goods.minStock,
            maxStock: values.goods.maxStock,
            barcode: values.goods.barcode || undefined,
            sku: values.goods.sku || undefined,
          };
        } else if (values.type === "SERVICE" && values.service) {
          payload.service = {
            durationMinutes: values.service.durationMinutes,
            sellingPrice: values.service.sellingPrice,
            providerName: values.service.providerName,
            providerPhone: values.service.providerPhone,
            providerEmail: values.service.providerEmail,
            commissionType: values.service.commissionType,
            commissionValue: values.service.commissionValue,
            bookingInWorkHours: values.service.bookingInWorkHours,
            mondayOpen: parseDate(values.service.mondayOpen),
            mondayClose: parseDate(values.service.mondayClose),
            tuesdayOpen: parseDate(values.service.tuesdayOpen),
            tuesdayClose: parseDate(values.service.tuesdayClose),
            wednesdayOpen: parseDate(values.service.wednesdayOpen),
            wednesdayClose: parseDate(values.service.wednesdayClose),
            thursdayOpen: parseDate(values.service.thursdayOpen),
            thursdayClose: parseDate(values.service.thursdayClose),
            fridayOpen: parseDate(values.service.fridayOpen),
            fridayClose: parseDate(values.service.fridayClose),
            saturdayOpen: parseDate(values.service.saturdayOpen),
            saturdayClose: parseDate(values.service.saturdayClose),
            sundayOpen: parseDate(values.service.sundayOpen),
            sundayClose: parseDate(values.service.sundayClose),
          };
        } else if (values.type === "TICKET" && values.ticket) {
          payload.ticket = {
            sellingPrice: values.ticket.sellingPrice,
            eventDate: values.ticket.eventDate,
            eventEndDate: values.ticket.eventEndDate,
            venue: values.ticket.venue,
            venueAddress: values.ticket.venueAddress,
            mapUrl: values.ticket.mapUrl,
            totalQuota: values.ticket.totalQuota,
            maxPerOrder: values.ticket.maxPerOrder,
            saleStartDate: values.ticket.saleStartDate,
            saleEndDate: values.ticket.saleEndDate,
            terms: values.ticket.terms,
            codeFormat: values.ticket.codeFormat,
            designConfig: values.ticket.designConfig,
          };
        }

        await updateMutation.mutateAsync({ id: productId, payload });
        gooeyToast.success("Produk berhasil diperbarui");
      }

      onSuccess?.();
      onClose?.();
    } catch (error: any) {
      // Rollback uploaded image if API call fails
      if (uploadedImageUrl) {
        try {
          await uploadApi.deleteByUrl(uploadedImageUrl);
        } catch (rollbackError) {
          console.error(
            "Failed to delete orphaned product image:",
            rollbackError,
          );
        }
      }
      gooeyToast.error(error?.response?.data?.message || "Gagal menyimpan produk");
      throw error;
    }
  };

  return {
    handleSubmit,
    isPending,
  };
}
