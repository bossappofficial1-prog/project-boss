"use client";

import React, { useMemo } from "react";
import { productApi, uploadApi } from "@/lib/api";
import z from "zod";
import { FormFieldConfig, ReusableForm } from "../ui/reuseable-form";
import { ProductItem } from "@/hooks/useProductsData";

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
// 1. Definisikan Schema per bagian secara eksplisit
const goodsSchema = z.object({
  currentStock: z.coerce.number().min(0, "Stok minimal 0"),
  minStock: z.coerce.number().min(0).nullable().optional(),
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
});

export type ServiceSchemaType = z.infer<typeof serviceSchema>;

export const productSchema = z.discriminatedUnion("type", [
  baseSchema.extend({
    type: z.literal("GOODS"),
    goods: goodsSchema,
    service: z.preprocess(() => undefined, z.undefined().optional()), // Paksa jadi undefined
  }),
  baseSchema.extend({
    type: z.literal("SERVICE"),
    service: serviceSchema,
    goods: z.preprocess(() => undefined, z.undefined().optional()), // Paksa jadi undefined
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
          },
          goods: undefined,
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

    const payload: any = {
      name: otherValues.get("name"),
      description: otherValues.get("description") || undefined,
      type: formType,
      status: otherValues.get("status"),
      outletId,
    };

    // Upload image and use returned URL
    if (file) {
      const uploaded = await uploadApi.uploadImage(file, { scope: "product" });
      payload.image = uploaded.url;
    }
    if (formType === "GOODS") {
      const goods: GoodsSchemaType = {
        averageHpp: Number(otherValues.get("goods[averageHpp]")) || 0,
        currentStock: Number(otherValues.get("goods[currentStock]")),
        sellingPrice: Number(otherValues.get("goods[sellingPrice]")) || 0,
        unit: (otherValues.get("service[unit]") || "pcs") as string,
        minStock: Number(otherValues.get("goods[stock]")) || null,
      };

      payload.goods = goods;
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
      };
      payload.service = service;
    }

    if (action === "add") {
      await productApi.create(payload);
    } else {
      await productApi.update(initialData?.id!, payload);
    }
    onSuccess?.();
    handleClose(false);
  };

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
      colSpan: 3,
      condition: (values) => values.type === "GOODS",
    },
    {
      name: "goods.minStock",
      label: "Minimal Stock (opsional)",
      type: "number",
      colSpan: 3,
      condition: (values) => values.type === "GOODS",
    },
    {
      name: "goods.sellingPrice",
      label: "Harga Jual *",
      type: "currency",
      colSpan: 4,
      condition: (values) => values.type === "GOODS",
    },
    {
      name: "goods.unit",
      label: "Satuan *",
      type: "text",
      colSpan: 2,
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
      colSpan: "full",
      placeholder: "contoh: jono",
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
