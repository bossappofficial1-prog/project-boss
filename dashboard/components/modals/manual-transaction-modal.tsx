"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, Package, Info } from "lucide-react";
import { useOutletStore } from "@/stores/outlet.store";
import { useQuery } from "@tanstack/react-query";
import { productApi } from "@/lib/api";
import { ProductItem } from "@/hooks/use-products-data";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

const manualTransactionSchema = z.object({
  transactionDate: z.string().min(1, "Tanggal transaksi wajib diisi"),
  customerName: z.string().max(100).optional(),
  customerPhone: z.string().regex(/^[0-9+\-\s()]*$/, "Format nomor telepon tidak valid").optional(),
  amount: z.coerce.number().positive("Jumlah harus lebih dari 0"),
  items: z.array(z.object({
    productId: z.string().min(1, "Pilih produk/jasa"),
    quantity: z.coerce.number().int().min(1, "Quantity minimal 1"),
    bookingDate: z.string().optional(),
  })).min(1, "Minimal 1 item"),
});

type ManualTransactionFormValues = z.infer<typeof manualTransactionSchema>;

interface ManualTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId: string;
  onSubmit: (payload: any) => Promise<any>;
  isLoading?: boolean;
}

export default function ManualTransactionModal({
  open,
  onOpenChange,
  outletId,
  onSubmit,
  isLoading = false,
}: ManualTransactionModalProps) {
  const form = useForm<ManualTransactionFormValues>({
    resolver: zodResolver(manualTransactionSchema) as any,
    defaultValues: {
      transactionDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      customerName: "",
      customerPhone: "",
      amount: 0,
      items: [{ productId: "", quantity: 1, bookingDate: "" }],
    },
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const watchedAmount = watch("amount");

  // Fetch products for dropdown
  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ["products", outletId, "manual-tx"],
    queryFn: () => productApi.getByOutlet(outletId, { limit: 500, status: "ACTIVE" }),
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

  // Auto-calculate total from items
  const calculatedTotal = useMemo(() => {
    if (!watchedItems) return 0;
    return watchedItems.reduce((sum, item) => {
      const product = productMap.get(item.productId);
      if (!product) return sum;
      let price = 0;
      if (product.type === "GOODS") price = product.goods?.sellingPrice ?? 0;
      else if (product.type === "SERVICE") price = product.service?.sellingPrice ?? 0;
      else if (product.type === "TICKET") price = product.ticket?.sellingPrice ?? 0;
      return sum + price * (item.quantity || 0);
    }, 0);
  }, [watchedItems, productMap]);

  // Auto-update amount when items change (only if user hasn't manually overridden)
  const [manualAmountOverride, setManualAmountOverride] = useState(false);

  useEffect(() => {
    if (!manualAmountOverride && calculatedTotal > 0) {
      setValue("amount", calculatedTotal);
    }
  }, [calculatedTotal, manualAmountOverride, setValue]);

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setManualAmountOverride(true);
      setValue("amount", Number(e.target.value) || 0);
    },
    [setValue]
  );

  const getSelectedProductType = useCallback(
    (index: number): string | null => {
      const productId = watchedItems?.[index]?.productId;
      if (!productId) return null;
      return productMap.get(productId)?.type ?? null;
    },
    [watchedItems, productMap]
  );

  const handleClose = useCallback(() => {
    if (!isLoading) {
      onOpenChange(false);
    }
  }, [isLoading, onOpenChange]);

  const handleFormSubmit = async (data: ManualTransactionFormValues) => {
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
          bookingDate: item.bookingDate ? new Date(item.bookingDate).toISOString() : undefined,
        })),
      });
      reset();
      setManualAmountOverride(false);
    } catch (err) {
      console.error("Failed to create manual transaction:", err);
    }
  };

  const addNewItem = () => {
    append({ productId: "", quantity: 1, bookingDate: "" });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Tambah Transaksi Manual
          </DialogTitle>
          <DialogDescription>
            Catat transaksi yang sudah terjadi sebelumnya. Transaksi akan langsung dicatat sebagai selesai (COMPLETED).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <Info className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Transaksi ini akan langsung dicatat sebagai <strong>SELESAI</strong> untuk barang maupun jasa.
              Stok barang akan otomatis dikurangi.
            </p>
          </div>

          {/* Transaction Date */}
          <div className="space-y-2">
            <Label htmlFor="transactionDate" className="text-sm font-medium">
              Tanggal Transaksi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="transactionDate"
              type="datetime-local"
              {...register("transactionDate")}
              className={cn(errors.transactionDate && "border-destructive")}
            />
            {errors.transactionDate && (
              <p className="text-xs text-destructive">{errors.transactionDate.message}</p>
            )}
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-sm font-medium">
                Nama Customer <span className="text-muted-foreground text-xs">(opsional)</span>
              </Label>
              <Input
                id="customerName"
                {...register("customerName")}
                placeholder="Masukkan nama customer"
                className={cn(errors.customerName && "border-destructive")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone" className="text-sm font-medium">
                Nomor Customer <span className="text-muted-foreground text-xs">(opsional)</span>
              </Label>
              <Input
                id="customerPhone"
                {...register("customerPhone")}
                placeholder="081234567890"
                className={cn(errors.customerPhone && "border-destructive")}
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Item Transaksi <span className="text-destructive">*</span>
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addNewItem}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Tambah Item
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => {
                const productType = getSelectedProductType(index);
                return (
                  <div
                    key={field.id}
                    className="p-4 rounded-md border border-border/60 bg-muted/20 space-y-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Item {index + 1}
                      </span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="h-7 px-2 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Product Select */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Produk/Jasa</Label>
                        <select
                          {...register(`items.${index}.productId`)}
                          className={cn(
                            "w-full h-9 rounded-md border bg-background px-3 text-sm",
                            "focus:outline-none focus:ring-1 focus:ring-primary/20",
                            errors.items?.[index]?.productId && "border-destructive"
                          )}
                        >
                          <option value="">Pilih produk/jasa</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — {formatCurrency(
                                p.type === "GOODS" ? p.goods?.sellingPrice ?? 0 :
                                p.type === "SERVICE" ? p.service?.sellingPrice ?? 0 :
                                p.ticket?.sellingPrice ?? 0
                              )}
                              {p.type === "GOODS" && ` (Stok: ${p.goods?.currentStock ?? 0})`}
                            </option>
                          ))}
                        </select>
                        {errors.items?.[index]?.productId && (
                          <p className="text-[10px] text-destructive">
                            {errors.items[index]?.productId?.message}
                          </p>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Jumlah</Label>
                        <Input
                          type="number"
                          min={1}
                          {...register(`items.${index}.quantity`)}
                          className={cn(errors.items?.[index]?.quantity && "border-destructive")}
                        />
                        {errors.items?.[index]?.quantity && (
                          <p className="text-[10px] text-destructive">
                            {errors.items[index]?.quantity?.message}
                          </p>
                        )}
                      </div>

                      {/* Booking Date (only for SERVICE) */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Waktu Booking
                          {productType !== "SERVICE" && (
                            <span className="text-muted-foreground text-[10px] ml-1">(untuk jasa)</span>
                          )}
                        </Label>
                        <Input
                          type="datetime-local"
                          {...register(`items.${index}.bookingDate`)}
                          disabled={productType !== "SERVICE"}
                          className={cn(
                            productType !== "SERVICE" && "opacity-50 cursor-not-allowed",
                            errors.items?.[index]?.bookingDate && "border-destructive"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {errors.items && typeof errors.items === "object" && "message" in errors.items && (
              <p className="text-xs text-destructive">{errors.items.message}</p>
            )}
          </div>

          {/* Total Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount" className="text-sm font-medium">
                Jumlah Uang Masuk <span className="text-destructive">*</span>
              </Label>
              {calculatedTotal > 0 && watchedAmount !== calculatedTotal && (
                <Badge variant="outline" className="text-[10px] font-bold">
                  Bervariasi dari item
                </Badge>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                Rp
              </span>
              <Input
                id="amount"
                type="number"
                min={0}
                {...register("amount")}
                onChange={handleAmountChange}
                className={cn("pl-10 font-bold", errors.amount && "border-destructive")}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
            {calculatedTotal > 0 && (
              <p className="text-[10px] text-muted-foreground">
                Total otomatis dari item: <strong>{formatCurrency(calculatedTotal)}</strong>
                {watchedAmount !== calculatedTotal && (
                  <span> — Anda mengubah ke: <strong>{formatCurrency(watchedAmount || 0)}</strong></span>
                )}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading || productsLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-2" />
                  Simpan Transaksi
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}