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
import { useOutletContext } from "@/components/providers/OutletProvider";

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
  taxPercentage: z.coerce.number().min(0).nullable().optional(),
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
  const { allowedProductTypes } = useOutletContext();
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
        taxPercentage: initialData.taxPercentage ?? null,
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
            providerEmail: initialData.service?.providerEmail ?? "",
            providerPhone: initialData.service?.providerPhone ?? "",
            bookingInWorkHours: initialData.service?.bookingInWorkHours ?? true,
            // Operating hours
            mondayOpen: parseDate(initialData.service?.mondayOpen),
            mondayClose: parseDate(initialData.service?.mondayClose),
            tuesdayOpen: parseDate(initialData.service?.tuesdayOpen),
            tuesdayClose: parseDate(initialData.service?.tuesdayClose),
            wednesdayOpen: parseDate(initialData.service?.wednesdayOpen),
            wednesdayClose: parseDate(initialData.service?.wednesdayClose),
            thursdayOpen: parseDate(initialData.service?.thursdayOpen),
            thursdayClose: parseDate(initialData.service?.thursdayClose),
            fridayOpen: parseDate(initialData.service?.fridayOpen),
            fridayClose: parseDate(initialData.service?.fridayClose),
            saturdayOpen: parseDate(initialData.service?.saturdayOpen),
            saturdayClose: parseDate(initialData.service?.saturdayClose),
            sundayOpen: parseDate(initialData.service?.sundayOpen),
            sundayClose: parseDate(initialData.service?.sundayClose),
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

  const handleSubmit = async (values: ProductFormValues | FormData) => {
    const fileEntry = (values as FormData).get("file");
    const file = fileEntry instanceof File ? fileEntry : null;
    const otherValues = values as FormData;
    const formType = otherValues.get("type") as ProductFormValues["type"] | null;

    const rawTax = otherValues.get("taxPercentage");
    const taxPercentage = rawTax !== null && rawTax !== "" ? Number(rawTax) : null;

    const payload: any = {
      name: otherValues.get("name"),
      description: otherValues.get("description") || undefined,
      type: formType,
      status: otherValues.get("status"),
      taxPercentage: taxPercentage,
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
      const minStockRaw = otherValues.get("goods[minStock]");
      const maxStockRaw = otherValues.get("goods[maxStock]");
      const goods = {
        averageHpp: Number(otherValues.get("goods[averageHpp]")) || 0,
        currentStock: Number(otherValues.get("goods[currentStock]")),
        sellingPrice: Number(otherValues.get("goods[sellingPrice]")) || 0,
        unit: (otherValues.get("goods[unit]") || "pcs") as string,
        minStock: minStockRaw !== null && minStockRaw !== "" ? Number(minStockRaw) : null,
        maxStock: maxStockRaw !== null && maxStockRaw !== "" ? Number(maxStockRaw) : null,
      };

      payload.goods = goods;
    } else if (formType === "TICKET") {
      const ticket: TicketSchemaType = {
        sellingPrice: Number(otherValues.get("ticket[sellingPrice]")) || 0,
        eventDate: new Date(otherValues.get("ticket[eventDate]") as string),
        eventEndDate: otherValues.get("ticket[eventEndDate]")
          ? new Date(otherValues.get("ticket[eventEndDate]") as string)
          : null,
        venue: (otherValues.get("ticket[venue]") || "") as string,
        venueAddress: (otherValues.get("ticket[venueAddress]") as string) || null,
        mapUrl: (otherValues.get("ticket[mapUrl]") as string) || null,
        totalQuota: Number(otherValues.get("ticket[totalQuota]")) || 100,
        maxPerOrder: Number(otherValues.get("ticket[maxPerOrder]")) || 5,
        saleStartDate: otherValues.get("ticket[saleStartDate]")
          ? new Date(otherValues.get("ticket[saleStartDate]") as string)
          : null,
        saleEndDate: otherValues.get("ticket[saleEndDate]")
          ? new Date(otherValues.get("ticket[saleEndDate]") as string)
          : null,
        terms: (otherValues.get("ticket[terms]") as string) || null,
      };
      payload.ticket = ticket;
    } else {
      const providerEmail = otherValues.get("service[providerEmail]") as string;
      const providerPhone = otherValues.get("service[providerPhone]") as string;

      const service: ServiceSchemaType = {
        commissionType: otherValues.get("service[commissionType]") as "PERCENTAGE" | "FIXED",
        commissionValue: Number(otherValues.get("service[commissionValue]")),
        durationMinutes: Number(otherValues.get("service[durationMinutes]")),
        providerName: otherValues.get("service[providerName]") as string,
        sellingPrice: Number(otherValues.get("service[sellingPrice]")),
        providerEmail: providerEmail && providerEmail.trim() !== "" ? providerEmail : undefined,
        providerPhone: providerPhone && providerPhone.trim() !== "" ? providerPhone : undefined,
        bookingInWorkHours: otherValues.get("service[bookingInWorkHours]") === "true",
        // Operating hours
        mondayOpen: otherValues.get("service[mondayOpen]")
          ? new Date(otherValues.get("service[mondayOpen]") as string)
          : null,
        mondayClose: otherValues.get("service[mondayClose]")
          ? new Date(otherValues.get("service[mondayClose]") as string)
          : null,
        tuesdayOpen: otherValues.get("service[tuesdayOpen]")
          ? new Date(otherValues.get("service[tuesdayOpen]") as string)
          : null,
        tuesdayClose: otherValues.get("service[tuesdayClose]")
          ? new Date(otherValues.get("service[tuesdayClose]") as string)
          : null,
        wednesdayOpen: otherValues.get("service[wednesdayOpen]")
          ? new Date(otherValues.get("service[wednesdayOpen]") as string)
          : null,
        wednesdayClose: otherValues.get("service[wednesdayClose]")
          ? new Date(otherValues.get("service[wednesdayClose]") as string)
          : null,
        thursdayOpen: otherValues.get("service[thursdayOpen]")
          ? new Date(otherValues.get("service[thursdayOpen]") as string)
          : null,
        thursdayClose: otherValues.get("service[thursdayClose]")
          ? new Date(otherValues.get("service[thursdayClose]") as string)
          : null,
        fridayOpen: otherValues.get("service[fridayOpen]")
          ? new Date(otherValues.get("service[fridayOpen]") as string)
          : null,
        fridayClose: otherValues.get("service[fridayClose]")
          ? new Date(otherValues.get("service[fridayClose]") as string)
          : null,
        saturdayOpen: otherValues.get("service[saturdayOpen]")
          ? new Date(otherValues.get("service[saturdayOpen]") as string)
          : null,
        saturdayClose: otherValues.get("service[saturdayClose]")
          ? new Date(otherValues.get("service[saturdayClose]") as string)
          : null,
        sundayOpen: otherValues.get("service[sundayOpen]")
          ? new Date(otherValues.get("service[sundayOpen]") as string)
          : null,
        sundayClose: otherValues.get("service[sundayClose]")
          ? new Date(otherValues.get("service[sundayClose]") as string)
          : null,
      };
      payload.service = service;

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
      ].filter(opt => allowedProductTypes.includes(opt.value)),
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
    {
      name: "taxPercentage",
      label: "Pajak (%)",
      type: "number",
      colSpan: 3,
      placeholder: "Contoh: 11",
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
      typeResolver(values) {
        return values.service?.commissionType == "FIXED" ? "currency" : "percentage";
      },
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
      name: "service.mondayOpen",
      label: "",
      type: "custom",
      colSpan: "full",
      condition: (values) => values.type === "SERVICE",
      renderCustom: () => (
        <ServiceOperatingHoursSection
          outletId={outletId!}
          value={{
            mondayOpen: form.watch("service.mondayOpen"),
            mondayClose: form.watch("service.mondayClose"),
            tuesdayOpen: form.watch("service.tuesdayOpen"),
            tuesdayClose: form.watch("service.tuesdayClose"),
            wednesdayOpen: form.watch("service.wednesdayOpen"),
            wednesdayClose: form.watch("service.wednesdayClose"),
            thursdayOpen: form.watch("service.thursdayOpen"),
            thursdayClose: form.watch("service.thursdayClose"),
            fridayOpen: form.watch("service.fridayOpen"),
            fridayClose: form.watch("service.fridayClose"),
            saturdayOpen: form.watch("service.saturdayOpen"),
            saturdayClose: form.watch("service.saturdayClose"),
            sundayOpen: form.watch("service.sundayOpen"),
            sundayClose: form.watch("service.sundayClose"),
          }}
          onChange={(value) => {
            form.setValue("service.mondayOpen", value.mondayOpen);
            form.setValue("service.mondayClose", value.mondayClose);
            form.setValue("service.tuesdayOpen", value.tuesdayOpen);
            form.setValue("service.tuesdayClose", value.tuesdayClose);
            form.setValue("service.wednesdayOpen", value.wednesdayOpen);
            form.setValue("service.wednesdayClose", value.wednesdayClose);
            form.setValue("service.thursdayOpen", value.thursdayOpen);
            form.setValue("service.thursdayClose", value.thursdayClose);
            form.setValue("service.fridayOpen", value.fridayOpen);
            form.setValue("service.fridayClose", value.fridayClose);
            form.setValue("service.saturdayOpen", value.saturdayOpen);
            form.setValue("service.saturdayClose", value.saturdayClose);
            form.setValue("service.sundayOpen", value.sundayOpen);
            form.setValue("service.sundayClose", value.sundayClose);
          }}
        />
      ),
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
