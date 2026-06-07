"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormFieldConfig, ReusableForm } from "../ui/reuseable-form";
import { ProductItem } from "@/hooks/use-products-data";
import ServiceOperatingHoursSection from "./service-operating-hours-section";
import { useOutletStore } from "@/stores/outlet.store";
import {
  productSchema,
  type ProductFormValues,
  useProductFormSubmit,
} from "@/hooks/api/use-products";
import { ProductType } from "@/types";
import { productCategoryApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { getProductFormDefaults } from "./product-form-utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId?: string | null;
  onSuccess?: () => void;
  action?: "add" | "edit";
  data?: ProductItem | null;
  initialData?: Partial<ProductItem & { image: string; taxName: string }>;
};

export default function AddOrEditProductServiceModal({
  open,
  onOpenChange,
  initialData,
  outletId,
  onSuccess,
  action = "edit",
}: Props) {
  const { allowedProductTypes, selectedOutlet } = useOutletStore();
  const isEdit = action === "edit";
  const outletType = selectedOutlet?.type!;
  const shouldProductType: `${ProductType}` =
    outletType == "RETAIL" || outletType == "FNB" || outletType == "CUSTOM"
      ? "GOODS"
      : outletType === "EVENT"
        ? "TICKET"
        : "SERVICE";

  const { data: categories } = useQuery({
    queryKey: ["product-categories", selectedOutlet?.id],
    queryFn: () => productCategoryApi.listByOutlet(selectedOutlet!.id),
    enabled: !!selectedOutlet?.id,
    staleTime: 5 * 60_000,
  });

  const defaultValues = useMemo<ProductFormValues>(() => {
    return getProductFormDefaults({
      isEdit,
      initialData,
      outletId,
      shouldProductType,
    });
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
      ].filter((opt) => allowedProductTypes.includes(opt.value)),
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
      colSpan: 2,
      condition: (values) => values.type === "GOODS",
    },
    {
      name: "taxPercentage",
      label: "Pajak (%)",
      type: "number",
      colSpan: 2,
      placeholder: "Contoh: 11",
    },
    {
      name: "taxName",
      label: "Keterangan Pajak",
      type: "text",
      colSpan: 2,
      placeholder: "Contoh: PPN, Service Charge, dll",
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
      name: "goods.barcode",
      label: "Barcode",
      type: "text",
      colSpan: 2,
      placeholder: "Scan atau ketik barcode",
      condition: (values) =>
        values.type === "GOODS" &&
        (outletType === "RETAIL" || outletType === "CUSTOM"),
    },
    {
      name: "goods.sku",
      label: "SKU (opsional)",
      type: "text",
      colSpan: 2,
      placeholder: "Kode SKU internal",
      condition: (values) =>
        values.type === "GOODS" &&
        (outletType === "RETAIL" || outletType === "CUSTOM"),
    },
    {
      name: "goods.minStock",
      label: "Stok Minimum (opsional)",
      type: "number",
      colSpan: 2,
      condition: (values) => values.type === "GOODS",
    },
    {
      name: "goods.maxStock",
      label: "Stok Maksimum (opsional)",
      type: "number",
      colSpan: 2,
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
      colSpan: 2,
      condition: (values) => values.type === "SERVICE",
    },
    {
      name: "service.durationMinutes",
      label: "Durasi Layanan (menit) *",
      type: "number",
      colSpan: 2,
      condition: (values) => values.type === "SERVICE",
    },
    {
      name: "service.bookingInWorkHours",
      label: "Booking di jam kerja",
      colSpan: 2,
      type: "dual-option-switch",
      switchOptions: {
        left: { label: "Tidak", value: false },
        right: { label: "Ya", value: true },
      },
      condition: (values) => values.type === "SERVICE",
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
      name: "service.commissionValue",
      label: "Harga Komisi",
      colSpan: 3,
      condition: (values) => values.type === "SERVICE",
      typeResolver(values) {
        return values.service?.commissionType == "FIXED"
          ? "currency"
          : "percentage";
      },
    },
    {
      name: "service.providerName",
      label: "Nama Penyedia",
      type: "text",
      colSpan: 2,
      placeholder: "contoh: jono",
      condition: (values) => values.type === "SERVICE",
    },
    {
      name: "service.providerEmail",
      label: "Email Penyedia (opsional)",
      type: "email",
      colSpan: 2,
      placeholder: "contoh: jono@gmail.com",
      condition: (values) => values.type === "SERVICE",
    },
    {
      name: "service.providerPhone",
      label: "Nomor Penyedia (opsional)",
      type: "tel",
      colSpan: 2,
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
    // product === ticket
    {
      name: "ticket.sellingPrice" as any,
      label: "Harga Tiket *",
      type: "currency",
      colSpan: 2,
      condition: (values) => values.type === "TICKET",
    },
    {
      name: "ticket.totalQuota" as any,
      label: "Total Kuota *",
      type: "number",
      colSpan: 2,
      condition: (values) => values.type === "TICKET",
    },
    {
      name: "ticket.maxPerOrder" as any,
      label: "Maks per Order",
      type: "number",
      colSpan: 2,
      condition: (values) => values.type === "TICKET",
    },
    {
      name: "ticket.eventDate" as any,
      label: "Tanggal Event *",
      type: "datetime-local",
      colSpan: 2,
      condition: (values) => values.type === "TICKET",
    },
    {
      name: "ticket.eventEndDate" as any,
      label: "Tanggal Selesai (opsional)",
      type: "datetime-local",
      colSpan: 2,
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
      colSpan: 2,
      condition: (values) => values.type === "TICKET",
    },
    {
      name: "ticket.saleStartDate" as any,
      label: "Mulai Penjualan (opsional)",
      type: "datetime-local",
      colSpan: 2,
      condition: (values) => values.type === "TICKET",
    },
    {
      name: "ticket.saleEndDate" as any,
      label: "Tutup Penjualan (opsional)",
      type: "datetime-local",
      colSpan: 2,
      condition: (values) => values.type === "TICKET",
    },
    {
      name: "ticket.designConfig.primaryColor" as any,
      label: "Warna Tema Tiket (Hex)",
      type: "text",
      placeholder: "contoh: #2563EB",
      colSpan: 2,
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
      className="md:max-w-4xl"
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
