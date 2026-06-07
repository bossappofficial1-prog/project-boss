"use client";

import { useMemo, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Info } from "lucide-react";
import { ReusableForm, FormFieldConfig } from "@/components/ui/reuseable-form";
import { productApi } from "@/lib/api";
import { ProductItem } from "@/hooks/use-products-data";
import { formatCurrency } from "@/lib/utils";
import {
  manualTransactionSchema,
  ManualTransactionFormValues,
  ManualTransactionModalProps,
} from "./manual-transaction.types";

export function ManualTransactionModal({
  open,
  onOpenChange,
  outletId,
  onSubmit,
  isLoading = false,
}: ManualTransactionModalProps) {
  const [manualAmountOverride, setManualAmountOverride] = useState(false);

  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ["products", outletId, "manual-tx"],
    queryFn: () =>
      productApi.getByOutlet(outletId, { limit: 500, status: "ACTIVE" }),
    enabled: !!outletId && open,
    staleTime: 5 * 60_000,
  });

  const products = useMemo(
    () => (productsResponse?.data as ProductItem[]) || [],
    [productsResponse]
  );

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  const productOptions = useMemo(
    () =>
      products.map((p) => {
        const price =
          p.type === "GOODS"
            ? p.goods?.sellingPrice ?? 0
            : p.type === "SERVICE"
              ? p.service?.sellingPrice ?? 0
              : p.ticket?.sellingPrice ?? 0;
        const desc = formatCurrency(price);
        const stock =
          p.type === "GOODS" ? ` | Stok: ${p.goods?.currentStock ?? 0}` : "";
        return { value: p.id, label: p.name, description: `${desc}${stock}` };
      }),
    [products]
  );

  const calculateTotal = useCallback(
    (items: ManualTransactionFormValues["items"]) => {
      if (!items) return 0;
      return items.reduce((sum, item) => {
        const product = productMap.get(item.productId);
        if (!product) return sum;
        let price = 0;
        if (product.type === "GOODS") price = product.goods?.sellingPrice ?? 0;
        else if (product.type === "SERVICE")
          price = product.service?.sellingPrice ?? 0;
        else if (product.type === "TICKET")
          price = product.ticket?.sellingPrice ?? 0;
        return sum + price * (item.quantity || 0);
      }, 0);
    },
    [productMap]
  );

  const defaultValues: ManualTransactionFormValues = {
    transactionDate: new Date(),
    customerName: "",
    customerPhone: "",
    amount: 0,
    items: [{ productId: "", quantity: 1, bookingDate: "" }],
  };

  const form = useForm<ManualTransactionFormValues>({
    resolver: zodResolver(manualTransactionSchema) as any,
    defaultValues,
  });

  const fields: FormFieldConfig<ManualTransactionFormValues>[] = useMemo(
    () => [
      {
        name: "transactionDate",
        label: "Tanggal Transaksi",
        type: "datetime-local",
      },
      {
        name: "amount",
        label: "Jumlah Uang Masuk",
        type: "currency",
      },
      {
        name: "customerName",
        label: "Nama Customer",
        type: "text",
        placeholder: "Masukkan nama customer",
        colSpan: 1,
      },
      {
        name: "customerPhone",
        label: "Nomor Customer",
        type: "tel",
        placeholder: "081234567890",
        colSpan: 1,
      },
      {
        name: "items",
        label: "Item Transaksi",
        type: "array",
        colSpan: "full",
        addButtonText: "Tambah Item",
        defaultItem: { productId: "", quantity: 1, bookingDate: "" },
        arrayFields: [
          {
            name: "productId" as any,
            label: "Produk/Jasa",
            type: "select",
            options: productOptions,
          },
          {
            name: "quantity" as any,
            label: "Jumlah",
            type: "number",
          },
          {
            name: "bookingDate" as any,
            label: "Waktu Booking",
            type: "datetime-local",
            disabled: true,
            dependsOn: {
              field: "items.0.productId" as any,
              condition: (value: unknown) => {
                const productId = value as string;
                if (!productId) return false;
                const product = productMap.get(productId);
                return product?.type === "SERVICE";
              },
              then: () => ({ disabled: false }),
            },
          },
        ],
      },

    ],
    [productOptions, productMap]
  );

  const handleValuesChange = useCallback(
    (values: Partial<ManualTransactionFormValues>) => {
      if (!manualAmountOverride && values.items) {
        const total = calculateTotal(values.items);
        if (total > 0 && values.amount !== total) {
          form.setValue("amount", total);
        }
      }
    },
    [manualAmountOverride, calculateTotal, form]
  );

  const handleSubmit = async (data: ManualTransactionFormValues) => {
    try {
      await onSubmit({
        outletId,
        transactionDate: new Date(data.transactionDate).toISOString(),
        customerName: data.customerName || undefined,
        customerPhone: data.customerPhone || undefined,
        amount: data.amount,
        items: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          bookingDate: item.bookingDate
            ? new Date(item.bookingDate).toISOString()
            : undefined,
        })),
      });
      setManualAmountOverride(false);
    } catch (err) {
      console.error("Failed to create manual transaction:", err);
    }
  };

  return (
    <ReusableForm
      form={form}
      schema={manualTransactionSchema}
      defaultValues={defaultValues}
      fields={fields}
      onSubmit={handleSubmit}
      onValuesChange={handleValuesChange}
      withDialog
      isDialogOpen={open}
      onDialogOpenChange={onOpenChange}
      dialogTitle="Tambah Transaksi Manual"
      dialogDescription="Catat transaksi yang sudah terjadi sebelumnya. Transaksi akan langsung dicatat sebagai selesai (COMPLETED)."
      submitText="Simpan Transaksi"
      cancelText="Batal"
      isLoading={isLoading || productsLoading}
      loadingText="Menyimpan..."
      gridCols={2}
      header={
        <div className="flex items-start gap-3 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 mb-4">
          <Info className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Transaksi ini akan langsung dicatat sebagai <strong>SELESAI</strong>{" "}
            untuk barang maupun jasa. Stok barang akan otomatis dikurangi.
          </p>
        </div>
      }
    />
  );
}

export default ManualTransactionModal;
