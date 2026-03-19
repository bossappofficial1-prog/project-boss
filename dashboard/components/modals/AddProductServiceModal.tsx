"use client";

import React, { useEffect, useMemo, useState } from "react";
import { productApi, uploadApi } from "@/lib/api";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormFieldConfig, ReusableForm } from "../ui/reuseable-form";
import { ProductItem } from "@/hooks/useProductsData";
import ServiceOperatingHoursSection from "./ServiceOperatingHoursSection";
import ServiceMediaUploader, { MediaItem } from "./ServiceMediaUploader";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId?: string | null;
  onSuccess?: () => void;
  action?: "add" | "edit";
  data?: ProductItem | null;
  initialData?: Partial<ProductItem & { image: string }>;
};

const ProductStatus = z.enum(["ACTIVE", "INACTIVE"]);

const baseSchema = z.object({
  name: z.string().min(2, "Nama produk minimal 2 karakter"),
  description: z.string().optional(),
  status: ProductStatus,
  file: z
    .union([
      z.instanceof(File).refine((f) => f.size <= 3 * 1024 * 1024, "Maksimal 3MB"),
      z.string(),
    ])
    .optional(),
});

const parseDate = (date: string | Date | null | undefined): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return date;
  return new Date(date);
};

// 1. Definisikan Schema per bagian secara eksplisit
const goodsSchema = z.object({
  currentStock: z.coerce.number().min(0, "Stok minimal 0"),
  minStock: z.coerce.number().min(0).nullable().optional(),
  maxStock: z.coerce.number().min(0).nullable().optional(),
  unit: z.string().min(1, "Unit wajib diisi"),
  sellingPrice: z.coerce.number().min(1, "Harga jual harus > 0"),
  averageHpp: z.coerce.number().min(1, "HPP harus > 0"),
});

export type GoodsSchemaType = z.infer<typeof goodsSchema>;

const serviceSchema = z.object({
  durationMinutes: z.coerce.number().min(1, "Durasi wajib diisi"),
  sellingPrice: z.coerce.number().min(1, "Harga wajib diisi"),
  providerName: z.string().min(1, "Nama provider wajib diisi"),
  providerPhone: z.preprocess((val) => (val === "" ? undefined : val), z.string().optional()),
  providerEmail: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().email().optional(),
  ),
  commissionType: z.enum(["PERCENTAGE", "FIXED"]),
  commissionValue: z.coerce.number().min(0),
  maxParallel: z.coerce.number().min(1).default(1),
  bookingInWorkHours: z.boolean().default(true),

  // Operating hours array
  operatingHours: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    openTime: z.union([z.coerce.date(), z.string()]),
    closeTime: z.union([z.coerce.date(), z.string()]),
    isOpen: z.boolean().default(true),
    isRestEnabled: z.boolean().default(false),
    restStartTime: z.union([z.coerce.date(), z.string()]).nullable().optional(),
    restEndTime: z.union([z.coerce.date(), z.string()]).nullable().optional(),
  })).optional(),
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

export default function AddOrEditProductServiceModal({
  open,
  onOpenChange,
  initialData,
  outletId,
  onSuccess,
  action = "edit",
}: Props) {
  const isEdit = action === "edit";
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (isEdit && initialData?.media) {
      setMediaItems(
        initialData.media.map((m, i) => ({
          url: m.url,
          type: m.type as "IMAGE" | "VIDEO",
          source: m.source as "UPLOAD" | "EMBED",
          alt: m.alt,
          order: m.order ?? i,
          thumbnailUrl: m.thumbnailUrl,
        })),
      );
    } else {
      setMediaItems([]);
    }
  }, [isEdit, initialData]);

  const defaultValues = useMemo<ProductFormValues>(() => {
    if (isEdit && initialData) {
      const baseNormalized = {
        name: initialData.name ?? "",
        description: initialData.description ?? "",
        status: initialData.status ?? ("ACTIVE" as const),
        file: initialData.image,
      };

      if (initialData.type === "GOODS") {
        return {
          ...baseNormalized,
          type: "GOODS" as const,
          goods: {
            currentStock: initialData.goods?.currentStock ?? 0,
            unit: initialData.goods?.unit ?? "pcs",
            averageHpp: initialData.goods?.averageHpp ?? 0,
            sellingPrice: initialData.goods?.sellingPrice ?? 0,
            minStock: initialData.goods?.minStock ?? null,
            maxStock: initialData.goods?.maxStock ?? null,
          },
          service: undefined,
        } satisfies ProductFormValues;
      }

      if (initialData.type === "SERVICE") {
        return {
          ...baseNormalized,
          type: "SERVICE" as const,
          service: {
            durationMinutes: initialData.service?.durationMinutes ?? 30,
            sellingPrice: initialData.service?.sellingPrice ?? 0,
            providerName: initialData.service?.providerName ?? "",
            commissionType: initialData.service?.commissionType ?? "FIXED",
            commissionValue: initialData.service?.commissionValue ?? 0,
            maxParallel: initialData.service?.maxParallel ?? 1,
            providerEmail: initialData.service?.providerEmail ?? "",
            providerPhone: initialData.service?.providerPhone ?? "",
            bookingInWorkHours: initialData.service?.bookingInWorkHours ?? true,
            // Operating hours
            operatingHours: initialData.service?.operatingHours || [],
          },
          goods: undefined,
          ticket: undefined,
        } satisfies ProductFormValues;
      }

      if (initialData.type === "TICKET") {
        return {
          ...baseNormalized,
          type: "TICKET" as const,
          ticket: {
            sellingPrice: initialData.ticket?.sellingPrice ?? 0,
            eventDate: parseDate(initialData.ticket?.eventDate) ?? new Date(),
            eventEndDate: parseDate(initialData.ticket?.eventEndDate),
            venue: initialData.ticket?.venue ?? "",
            venueAddress: initialData.ticket?.venueAddress ?? null,
            mapUrl: initialData.ticket?.mapUrl ?? null,
            totalQuota: initialData.ticket?.totalQuota ?? 100,
            maxPerOrder: initialData.ticket?.maxPerOrder ?? 5,
            saleStartDate: parseDate(initialData.ticket?.saleStartDate),
            saleEndDate: parseDate(initialData.ticket?.saleEndDate),
            terms: initialData.ticket?.terms ?? null,
          },
          goods: undefined,
          service: undefined,
        } satisfies ProductFormValues;
      }

      return baseNormalized as ProductFormValues;
    }

    return {
      type: "GOODS",
      name: "",
      description: "",
      status: "ACTIVE",
      outletId: outletId!,

      goods: {
        currentStock: 0,
        unit: "pcs",
        averageHpp: 0,
        sellingPrice: 0,
        minStock: null,
        maxStock: null,
      },

      service: { commissionType: "FIXED" } as any,
      file: undefined,
    };
  }, [isEdit, initialData, outletId]);

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  const handleSubmit = async () => {
    const rawValues = form.getValues();
    const file = rawValues.file instanceof File ? rawValues.file : null;
    const formType = rawValues.type;

    const payload: any = {
      name: rawValues.name,
      description: rawValues.description || undefined,
      type: formType,
      status: rawValues.status,
      outletId,
    };

    let uploadedImageUrl = undefined;
    // Upload image and use returned URL
    if (file) {
      const uploaded = await uploadApi.uploadImage(file, { scope: "product" });
      payload.image = uploaded.url;
      uploadedImageUrl = uploaded.url;
    }

    if (formType === "GOODS") {
      const g = rawValues.goods;
      if (g) {
        payload.goods = {
          averageHpp: Number(g.averageHpp) || 0,
          currentStock: Number(g.currentStock) || 0,
          sellingPrice: Number(g.sellingPrice) || undefined,
          unit: g.unit || "pcs",
          minStock: g.minStock !== null && g.minStock !== undefined ? Number(g.minStock) : null,
          maxStock: g.maxStock !== null && g.maxStock !== undefined ? Number(g.maxStock) : null,
        };
      }
    } else if (formType === "TICKET") {
      const t = rawValues.ticket;
      if (t) {
        payload.ticket = {
          sellingPrice: Number(t.sellingPrice) || 0,
          eventDate: new Date(t.eventDate),
          eventEndDate: t.eventEndDate ? new Date(t.eventEndDate) : null,
          venue: t.venue || "",
          venueAddress: t.venueAddress || null,
          mapUrl: t.mapUrl || null,
          totalQuota: Number(t.totalQuota) || 100,
          maxPerOrder: Number(t.maxPerOrder) || 5,
          saleStartDate: t.saleStartDate ? new Date(t.saleStartDate) : null,
          saleEndDate: t.saleEndDate ? new Date(t.saleEndDate) : null,
          terms: t.terms || null,
        };
      }
    } else if (formType === "SERVICE") {
      const s = rawValues.service;
      if (s) {
        payload.service = {
          ...s,
          durationMinutes: Number(s.durationMinutes) || 30,
          sellingPrice: Number(s.sellingPrice) || undefined,
          commissionValue: Number(s.commissionValue) || 0,
          maxParallel: Number(s.maxParallel) || 1,
          operatingHours: s.operatingHours || [],
        };
      }

      // Attach media gallery for SERVICE type
      if (mediaItems.length > 0) {
        payload.media = mediaItems;
      } else {
        payload.media = [];
      }
    }

    try {
      if (action === "add") {
        await productApi.create(payload);
      } else {
        await productApi.update(initialData?.id!, payload);
      }
    } catch (error) {
      // rollback image if create/update fails
      if (uploadedImageUrl) {
        try {
          await uploadApi.deleteByUrl(uploadedImageUrl);
        } catch (e) {
          console.error("Failed to delete orphaned product image:", e);
        }
      }
      throw error;
    }
    onSuccess?.();
    handleClose(false);
  };

  // Create explicit form instance
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues,
  });

  const formType = form.watch("type");

  // mulai perubahan
  const fields: FormFieldConfig<ProductFormValues>[] = [
    {
      name: "type",
      label: "Jenis *",
      type: "select",
      disabled: action === "edit",
      colSpan: 4,
      placeholder: "Pilih jenis produk",
      options: [
        {
          label: "Produk (Barang)",
          value: "GOODS",
        },
        {
          label: "Jasa (Layanan)",
          value: "SERVICE",
        },
        {
          label: "Tiket (Event)",
          value: "TICKET",
        },
      ],
    },
    {
      name: "status",
      label: "Status *",
      colSpan: 2,
      type: "dual-option-switch",
      switchOptions: {
        left: { label: "Tidak Aktif", value: "INACTIVE" },
        right: { label: "Aktif", value: "ACTIVE" },
      },
    },
    {
      name: "name",
      label: "Nama *",
      type: "text",
      colSpan: "full",
      placeholder: "Contoh: Kopi susu gula aren",
    },
    {
      name: "description",
      label: "Deskripsi (opsional)",
      type: "textarea",
      colSpan: "full",
      placeholder: "Deskripsikan produk anda",
    },

    // product === goods

    {
      name: "goods.averageHpp",
      label: "Harga Modal (HPP) *",
      type: "currency",
      colSpan: "full",
      condition: (values) => values.type === "GOODS",
    },
    {
      name: "goods.currentStock",
      label: "Stok Sekarang *",
      type: "number",
      colSpan: 2,
      condition: (values) => values.type === "GOODS",
    },
    {
      name: "goods.unit",
      label: "Satuan *",
      type: "text",
      colSpan: 2,
      placeholder: "pcs, kg, box...",
      condition: (values) => values.type === "GOODS",
    },
    {
      name: "goods.minStock",
      label: "Stok Minimum (opsional)",
      type: "number",
      colSpan: 3,
      condition: (values) => values.type === "GOODS",
    },
    {
      name: "goods.maxStock",
      label: "Stok Maksimum (opsional)",
      type: "number",
      colSpan: 3,
      condition: (values) => values.type === "GOODS",
    },
    {
      name: "goods.sellingPrice",
      label: "Harga Jual *",
      type: "currency",
      colSpan: "full",
      condition: (values) => values.type === "GOODS",
    },

    // product === service
    {
      name: "service.sellingPrice",
      label: "Harga",
      type: "currency",
      colSpan: 3,
      condition: (values) => values.type === "SERVICE",
    },
    {
      name: "service.durationMinutes",
      label: "Durasi Layanan (menit) *",
      type: "number",
      colSpan: 3,
      condition: (values) => values.type === "SERVICE",
    },
    {
      name: "service.commissionValue",
      label: "Harga Komisi",
      colSpan: 3,
      condition: (values) => values.type === "SERVICE",
      typeResolver: (values) =>
        values.service?.commissionType == "FIXED" ? "currency" : "presentage",
    },
    {
      name: "service.commissionType",
      label: "Tipe Komisi",
      type: "select",
      placeholder: "Tipe Komisi",
      options: [
        { label: "Nominal (Tetap)", value: "FIXED" },
        { label: "Persentase (%)", value: "PERCENTAGE" },
      ],
      colSpan: 3,
      condition: (values) => values.type === "SERVICE",
    },
    {
      name: "service.providerName",
      label: "Nama Penyedia",
      type: "text",
      colSpan: 3,
      placeholder: "contoh: jono",
      condition: (values) => values.type === "SERVICE",
    },
    {
      name: "service.bookingInWorkHours",
      label: "Booking di jam kerja",
      colSpan: 3,
      type: "dual-option-switch",
      switchOptions: {
        left: { label: "Tidak", value: false },
        right: { label: "Ya", value: true },
      },
      condition: (values) => values.type === "SERVICE",
    },
    {
      name: "service.providerEmail",
      label: "Email Penyedia (opsional)",
      type: "email",
      colSpan: 3,
      placeholder: "contoh: jono@gmail.com",
      condition: (values) => values.type === "SERVICE",
    },
    {
      name: "service.providerPhone",
      label: "Nomor Penyedia (opsional)",
      type: "tel",
      colSpan: 3,
      placeholder: "contoh: 081234567890",
      condition: (values) => values.type === "SERVICE",
    },
    // Custom renderer for operating hours
    {
      name: "service.operatingHours",
      label: "",
      type: "custom",
      colSpan: "full",
      condition: (values) => values.type === "SERVICE",
      renderCustom: () => {
        // Operating hours mapped to array format
        const currentOperatingHours = (form.watch("service.operatingHours") as any[]) || [];
        return (
          <ServiceOperatingHoursSection
            outletId={outletId!}
            value={currentOperatingHours}
            onChange={(val) => {
              form.setValue("service.operatingHours", val, { shouldValidate: true, shouldDirty: true });
            }}
          />
        );
      },
    },
    // Media gallery uploader for SERVICE
    {
      name: "service.mediaGallery" as any,
      label: "",
      type: "custom",
      colSpan: "full",
      condition: (values) => values.type === "SERVICE",
      renderCustom: () => (
        <ServiceMediaUploader
          value={mediaItems}
          onChange={setMediaItems}
          maxItems={5}
        />
      ),
    },

    // product === ticket
    {
      name: "ticket.sellingPrice" as any,
      label: "Harga Tiket *",
      type: "currency",
      colSpan: 3,
      condition: (values) => values.type === "TICKET",
    },
    {
      name: "ticket.totalQuota" as any,
      label: "Total Kuota *",
      type: "number",
      colSpan: 3,
      condition: (values) => values.type === "TICKET",
    },
    {
      name: "ticket.eventDate" as any,
      label: "Tanggal Event *",
      type: "datetime-local",
      colSpan: 3,
      condition: (values) => values.type === "TICKET",
    },
    {
      name: "ticket.eventEndDate" as any,
      label: "Tanggal Selesai (opsional)",
      type: "datetime-local",
      colSpan: 3,
      condition: (values) => values.type === "TICKET",
    },
    {
      name: "ticket.venue" as any,
      label: "Nama Venue *",
      type: "text",
      colSpan: "full",
      placeholder: "contoh: Stadion GBK, Pelabuhan Merak",
      condition: (values) => values.type === "TICKET",
    },
    {
      name: "ticket.venueAddress" as any,
      label: "Alamat Venue (opsional)",
      type: "text",
      colSpan: "full",
      placeholder: "Alamat lengkap venue",
      condition: (values) => values.type === "TICKET",
    },
    {
      name: "ticket.mapUrl" as any,
      label: "Link Google Maps (opsional)",
      type: "text",
      colSpan: "full",
      placeholder: "https://maps.google.com/...",
      condition: (values) => values.type === "TICKET",
    },
    {
      name: "ticket.maxPerOrder" as any,
      label: "Maks per Order",
      type: "number",
      colSpan: 3,
      condition: (values) => values.type === "TICKET",
    },
    {
      name: "ticket.saleStartDate" as any,
      label: "Mulai Penjualan (opsional)",
      type: "datetime-local",
      colSpan: 3,
      condition: (values) => values.type === "TICKET",
    },
    {
      name: "ticket.saleEndDate" as any,
      label: "Tutup Penjualan (opsional)",
      type: "datetime-local",
      colSpan: 3,
      condition: (values) => values.type === "TICKET",
    },
    {
      name: "ticket.terms" as any,
      label: "Syarat & Ketentuan (opsional)",
      type: "textarea",
      colSpan: "full",
      placeholder: "Syarat dan ketentuan tiket",
      condition: (values) => values.type === "TICKET",
    },
    {
      name: "file",
      label: "Gambar Produk",
      type: "file",
      colSpan: "full",
      accept: { "image/*": [".jpeg", ".png", ".webp", ".jpg"] },
      maxSizes: 3 * 1024 * 1024,
    },
  ];

  return (
    <ReusableForm
      form={form}
      withDialog
      gridCols={6}
      useFormData={false}
      isDialogOpen={open}
      onDialogOpenChange={handleClose}
      fields={fields}
      onSubmit={handleSubmit}
      schema={productSchema}
      defaultValues={defaultValues}
    />
  );
}
