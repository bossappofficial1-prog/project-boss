"use client";

import React, { useState } from "react";
import { gooeyToast } from "goey-toast";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Check, Package, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ReusableForm, FormFieldConfig } from "@/components/ui/reuseable-form";
import {
  useCreateSupplier,
  useUpdateSupplier,
} from "@/hooks/api/use-suppliers";
import { posV2Api } from "@/lib/apis/pos-v2";
import type { Supplier } from "@/lib/apis/supplier";

// ─── Schema ────────────────────────────────────────────────────────────────

const supplierSchema = z.object({
  name: z.string().min(1, "Nama supplier wajib diisi"),
  phone: z.string().optional(),
  email: z
    .string()
    .email("Format email tidak valid")
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
  productGoodsIds: z.array(z.string()).optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

// ─── Props ─────────────────────────────────────────────────────────────────

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  outletId: string;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function SupplierFormDialog({
  open,
  onOpenChange,
  supplier,
  outletId,
}: SupplierFormDialogProps) {
  const isEdit = !!supplier;
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  // Fetch produk GOODS outlet (hanya saat dialog terbuka)
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["supplier-goods-products", outletId],
    queryFn: () => posV2Api.getProducts(outletId, undefined, "GOODS"),
    enabled: open && !!outletId,
    staleTime: 30_000,
  });

  const goodsProducts = (productsData?.products ?? []).filter(
    (p) => p.goodsId && !p.hasRecipe
  );

  // ─── Default values ───────────────────────────────────────────────────

  const defaultValues: SupplierFormValues = {
    name: supplier?.name ?? "",
    phone: supplier?.phone ?? "",
    email: supplier?.email ?? "",
    address: supplier?.address ?? "",
    notes: supplier?.notes ?? "",
    productGoodsIds: supplier?.products?.map((sp) => sp.productGoods.id) ?? [],
  };

  // ─── Submit ───────────────────────────────────────────────────────────

  const handleSubmit = async (values: SupplierFormValues) => {
    if (isEdit) {
      await updateMutation.mutateAsync({ id: supplier.id, payload: values });
      gooeyToast.success("Supplier berhasil diperbarui");
    } else {
      await createMutation.mutateAsync({ ...values, outletId });
      gooeyToast.success("Supplier berhasil ditambahkan");
    }
    onOpenChange(false);
  };

  // ─── Fields ───────────────────────────────────────────────────────────

  const fields: FormFieldConfig<SupplierFormValues>[] = [
    {
      name: "name",
      label: "Nama Supplier",
      type: "text",
      placeholder: "Contoh: PT Sumber Makmur",
      colSpan: 2,
    },
    {
      name: "phone",
      label: "Telepon",
      type: "tel",
      placeholder: "08xxxxxxxxxx",
      colSpan: 1,
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "supplier@email.com",
      colSpan: 1,
    },
    {
      name: "address",
      label: "Alamat",
      type: "text",
      placeholder: "Alamat supplier",
      colSpan: 2,
    },
    {
      name: "notes",
      label: "Catatan",
      type: "textarea",
      placeholder: "Catatan tambahan (opsional)",
      colSpan: 2,
    },
    {
      name: "productGoodsIds",
      label: "Produk yang Dipasok",
      type: "custom",
      colSpan: 2,
      renderCustom: ({ field, form }) => {
        const selected: string[] = (field.value as string[]) ?? [];

        const handleToggle = (goodsId: string) => {
          const next = selected.includes(goodsId)
            ? selected.filter((id) => id !== goodsId)
            : [...selected, goodsId];
          form.setValue("productGoodsIds", next, { shouldDirty: true });
        };

        return (
          <ProductSelector
            goodsProducts={goodsProducts}
            isLoading={productsLoading}
            selected={selected}
            onToggle={handleToggle}
          />
        );
      },
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <ReusableForm
      schema={supplierSchema}
      defaultValues={defaultValues}
      fields={fields}
      onSubmit={handleSubmit}
      gridCols={2}
      withDialog
      isDialogOpen={open}
      onDialogOpenChange={onOpenChange}
      dialogTitle={isEdit ? "Edit Supplier" : "Tambah Supplier"}
      dialogDescription={
        isEdit
          ? "Perbarui informasi dan produk yang dipasok supplier ini."
          : "Isi data supplier dan pilih produk yang mereka pasok."
      }
      submitText={isEdit ? "Simpan Perubahan" : "Tambah Supplier"}
      loadingText="Menyimpan..."
      cancelText="Batal"
    />
  );
}

// ─── ProductSelector (sub-komponen untuk renderCustom) ─────────────────────

interface ProductSelectorProps {
  goodsProducts: { id: string; name: string; goodsId: string | null; unit: string | null }[];
  isLoading: boolean;
  selected: string[];
  onToggle: (goodsId: string) => void;
}

function ProductSelector({ goodsProducts, isLoading, selected, onToggle }: ProductSelectorProps) {
  const [productSearch, setProductSearch] = useState("");

  const filtered = productSearch.trim()
    ? goodsProducts.filter((p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase())
      )
    : goodsProducts;

  return (
    <div className="space-y-2">
      {/* Header count */}
      <div className="flex items-center justify-between">
        {selected.length > 0 && (
          <Badge variant="secondary" className="text-[10px] font-bold">
            {selected.length} dipilih
          </Badge>
        )}
      </div>

      {/* Search produk */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Cari produk..."
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          className="pl-8 h-9 text-xs"
        />
      </div>

      {/* Product list */}
      <div className="border rounded-md max-h-[180px] overflow-y-auto bg-muted/20">
        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
            Memuat produk...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-xs text-muted-foreground">
            <Package className="h-5 w-5 mb-1 opacity-40" />
            {productSearch ? "Produk tidak ditemukan" : "Belum ada produk GOODS"}
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((product) => {
              const isSelected = product.goodsId
                ? selected.includes(product.goodsId)
                : false;
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => product.goodsId && onToggle(product.goodsId)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-xs transition-colors hover:bg-muted/60 ${
                    isSelected ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="font-medium truncate">{product.name}</span>
                    {product.unit && (
                      <span className="text-muted-foreground shrink-0">/ {product.unit}</span>
                    )}
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Chips produk terpilih */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {selected.map((gid) => {
            const prod = goodsProducts.find((p) => p.goodsId === gid);
            if (!prod) return null;
            return (
              <Badge
                key={gid}
                variant="secondary"
                className="text-[10px] font-medium gap-1 pr-1"
              >
                {prod.name}
                <button
                  type="button"
                  onClick={() => onToggle(gid)}
                  className="hover:text-destructive ml-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
