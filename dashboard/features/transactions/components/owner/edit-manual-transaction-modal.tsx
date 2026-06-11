"use client";

import { useMemo, useCallback, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Info } from "lucide-react";
import { ReusableForm, FormFieldConfig } from "@/components/ui/reuseable-form";
import { productApi } from "@/lib/api";
import { ProductItem } from "@/hooks/use-products-data";
import { formatCurrency } from "@/lib/utils";
import { Transaction } from "@/lib/apis/transaction";
import {
  manualTransactionSchema,
  ManualTransactionFormValues,
} from "./manual-transaction.types";

export interface EditManualTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onSubmit: (payload: any) => Promise<any>;
  isLoading?: boolean;
}

export function EditManualTransactionModal({
  open,
  onOpenChange,
  transaction,
  onSubmit,
  isLoading = false,
}: EditManualTransactionModalProps) {
  const manualAmountOverrideRef = useRef(false);
  const hasInitialized = useRef(false);

  const order = transaction?.order;
  const guestCustomer = order?.guestCustomer;

  const outletId = transaction?.outlet?.id || "";

  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ["products", outletId, "edit-manual-tx"],
    queryFn: () =>
      productApi.getByOutlet(outletId, { limit: 500, status: "ACTIVE" }),
    enabled: !!outletId && open,
    staleTime: 5 * 60_000,
  });

  const products = useMemo(
    () => (productsResponse?.data as ProductItem[]) || [],
    [productsResponse],
  );

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const productOptions = useMemo(
    () =>
      products.map((p) => {
        const price =
          p.type === "GOODS"
            ? (p.goods?.sellingPrice ?? 0)
            : p.type === "SERVICE"
              ? (p.service?.sellingPrice ?? 0)
              : (p.ticket?.sellingPrice ?? 0);
        const desc = formatCurrency(price);
        const stock =
          p.type === "GOODS" ? ` | Stok: ${p.goods?.currentStock ?? 0}` : "";
        return { value: p.id, label: p.name, description: `${desc}${stock}` };
      }),
    [products],
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
    [productMap],
  );

  const defaultValues = useMemo<ManualTransactionFormValues>(
    () => ({
      transactionDate: transaction?.createdAt
        ? new Date(transaction.createdAt)
        : new Date(),
      customerName: guestCustomer?.name || "",
      customerPhone: guestCustomer?.phone || "",
      amount: transaction?.amount || 0,
      items: order?.items?.map((item) => ({
        productId: item.product?.name
          ? order.items.find((i) => i.id === item.id)?.productId || item.id
          : "",
        quantity: item.quantity,
        bookingDate: "",
      })) || [{ productId: "", quantity: 1, bookingDate: "" }],
    }),
    [transaction, order, guestCustomer],
  );

  const form = useForm<ManualTransactionFormValues>({
    resolver: zodResolver(manualTransactionSchema) as any,
    defaultValues,
  });

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction && open && !hasInitialized.current && products.length > 0) {
      hasInitialized.current = true;

      const mappedItems =
        order?.items?.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          bookingDate: "",
        })) || [];

      form.reset({
        transactionDate: transaction.createdAt
          ? new Date(transaction.createdAt)
          : new Date(),
        customerName: guestCustomer?.name || "",
        customerPhone: guestCustomer?.phone || "",
        amount: transaction.amount || 0,
        items:
          mappedItems.length > 0
            ? mappedItems
            : [{ productId: "", quantity: 1, bookingDate: "" }],
      });
    }

    if (!open) {
      hasInitialized.current = false;
    }
  }, [transaction, open, products, order, guestCustomer, form]);

  const fields = useMemo<FormFieldConfig<ManualTransactionFormValues>[]>(
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
    [productOptions, productMap],
  );

  const lastTotalRef = useRef<number>(0);

  const handleValuesChange = useCallback(
    (values: Partial<ManualTransactionFormValues>) => {
      if (!manualAmountOverrideRef.current && values.items) {
        const total = calculateTotal(values.items);
        if (total > 0 && total !== lastTotalRef.current) {
          lastTotalRef.current = total;
          form.setValue("amount", total, {
            shouldValidate: false,
            shouldDirty: false,
          });
        }
      }
    },
    [calculateTotal, form],
  );

  const handleSubmit = async (data: ManualTransactionFormValues) => {
    if (!transaction) return;
    try {
      await onSubmit({
        transactionId: transaction.id,
        payload: {
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
        },
      });
      manualAmountOverrideRef.current = false;
      lastTotalRef.current = 0;
    } catch (err) {
      console.error("Failed to update manual transaction:", err);
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
      dialogTitle="Edit Transaksi Manual"
      dialogDescription="Ubah detail transaksi manual. Stok barang akan otomatis disesuaikan."
      submitText="Simpan Perubahan"
      cancelText="Batal"
      isLoading={isLoading || productsLoading}
      loadingText="Menyimpan..."
      gridCols={2}
      header={
        <div className="flex items-start gap-3 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-4">
          <Info className="w-4 h-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Mengubah item atau jumlah akan mengembalikan stok lama dan
            mengurangi stok baru secara otomatis.
          </p>
        </div>
      }
    />
  );
}

export default EditManualTransactionModal;
