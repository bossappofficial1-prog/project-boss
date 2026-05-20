"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormFieldConfig, ReusableForm } from "../ui/reuseable-form";
import { ProductItem } from "@/hooks/useProductsData";
import ServiceOperatingHoursSection from "./ServiceOperatingHoursSection";
import ServiceMediaUploader, { MediaItem } from "./ServiceMediaUploader";
import { useOutletContext } from "@/components/providers/OutletProvider";
import {
  productSchema,
  type ProductFormValues,
  useProductFormSubmit,
} from "@/hooks/api/use-products";
import { ProductType } from "@/types";
import { productCategoryApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId?: string | null;
  onSuccess?: () => void;
  action?: "add" | "edit";
  data?: ProductItem | null;
  initialData?: Partial<ProductItem & { image: string, taxName: string }>;
};

const parseDate = (date: string | Date | null | undefined): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return date;
  return new Date(date);
};

export default function AddOrEditProductServiceModal({
  open,
  onOpenChange,
  initialData,
  outletId,
  onSuccess,
  action = "edit",
}: Props) {
  const { allowedProductTypes, selectedOutlet } = useOutletContext();
  const isEdit = action === "edit";
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const outletType = selectedOutlet?.type!;
  const shouldProductType: `${ProductType}` =
    (outletType == "RETAIL" || outletType == "FNB" || outletType == "CUSTOM")
      ? "GOODS" : outletType === "EVENT" ? "TICKET" : "SERVICE"

  const { data: categories } = useQuery({
    queryKey: ["product-categories", selectedOutlet?.id],
    queryFn: () => productCategoryApi.listByOutlet(selectedOutlet!.id),
    enabled: !!selectedOutlet?.id,
    staleTime: 5 * 60_000,
  });

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
        categoryId: initialData.categoryId ?? null,
        taxPercentage: initialData.taxPercentage ?? null,
        taxName: initialData.taxName ?? "",
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
            codeFormat: (initialData.ticket?.codeFormat as any) ?? "QR_CODE",
            designConfig: (initialData.ticket?.designConfig as any) ?? { primaryColor: "", backgroundColor: "", layoutType: "standard" },
          },
          goods: undefined,
          service: undefined,
        } satisfies ProductFormValues;
      }

      return baseNormalized as ProductFormValues;
    }

    return {
      type: shouldProductType,
      name: "",
      description: "",
      status: "ACTIVE",
      categoryId: null,
      taxPercentage: null,
      taxName: "",
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
    } as unknown as ProductFormValues;
  }, [isEdit, initialData, outletId, shouldProductType]);

  // Create explicit form instance
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues,
  });

  const { handleSubmit, isPending } = useProductFormSubmit({
    form,
    outletId,
    action,
    productId: initialData?.id,
    onSuccess,
    onClose: () => onOpenChange(false),
    mediaItems,
  });

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
      name: "categoryId",
      label: "Kategori",
      type: "select",
      colSpan: "full",
      placeholder: "Pilih kategori (opsional)",
      options: (categories ?? []).map((c) => ({
        label: c.name,
        value: c.id,
      })),
    },

    // product === goods

    {
      name: "goods.averageHpp",
      label: "Harga Modal (HPP) *",
      type: "currency",
      colSpan: 3,
      condition: (values) => values.type === "GOODS",
    },
    {
      name: "taxPercentage",
      label: "Pajak (%)",
      type: "number",
      colSpan: 3,
      placeholder: "Contoh: 11",
    },
    {
      name: "taxName",
      label: "Keterangan Pajak",
      type: "text",
      colSpan: 3,
      placeholder: "Contoh: PPN, Service Charge, dll",
    },
    {
      name: "goods.currentStock",
      label: "Stok Sekarang *",
      type: "number",
      colSpan: 3,
      condition: (values) => values.type === "GOODS",
    },
    {
      name: "goods.unit",
      label: "Satuan *",
      type: "text",
      colSpan: 3,
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
    // Media gallery uploader for SERVICE / GOODS
    {
      name: "service.mediaGallery" as any,
      label: "",
      type: "custom",
      colSpan: "full",
      condition: (values) => values.type === "SERVICE" || values.type === "GOODS",
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
      name: "ticket.codeFormat" as any,
      label: "Format Kode Scanner",
      placeholder: "Pilih Tipe Scanner",
      type: "select",
      options: [
        { label: "QR Code (Standar Kamera)", value: "QR_CODE" },
        { label: "Barcode 128 (Laser Scanner)", value: "BARCODE_128" },
      ],
      colSpan: 3,
      condition: (values) => values.type === "TICKET",
    },
    {
      name: "ticket.designConfig.primaryColor" as any,
      label: "Warna Tema Tiket (Hex)",
      type: "text",
      placeholder: "contoh: #2563EB",
      colSpan: 3,
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
      className={'max-w-3xl'}
      form={form}
      withDialog
      gridCols={6}
      useFormData={false}
      isDialogOpen={open}
      onDialogOpenChange={onOpenChange}
      fields={fields}
      onSubmit={handleSubmit}
      schema={productSchema}
      defaultValues={defaultValues}
      isLoading={isPending}
    />
  );
}
