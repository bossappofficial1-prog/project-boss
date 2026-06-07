"use client";

import React from "react";
import { toast } from "sonner";
import { ArrowDownToLine, Undo2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCashierContext } from "@/components/layouts";
import {
  usePOBProducts,
  usePOBStockIn,
  usePOBStockReturn,
  usePOBUploadFaktur,
  type POBProduct,
  type POBCartItem,
} from "@/hooks/api/use-pob-v2";
import { cn } from "@/lib/utils";
import { ProductCatalog } from "./product-catalog";
import { CartPanel } from "./cart-panel";
import { TransactionInfoForm } from "./transaction-info-form";
import { SuccessDialog } from "./success-dialog";

interface SuccessState {
  type: "PURCHASE" | "RETURN";
  itemCount: number;
  totalAmount: number;
}

export function PobV2Content() {
  const { outletData } = useCashierContext();
  const outletId = outletData?.id as string;

  // Search
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Cart
  const [cart, setCart] = React.useState<Record<string, POBCartItem>>({});

  // Transaction info
  const [referenceType, setReferenceType] = React.useState("PURCHASE");
  const [referenceId, setReferenceId] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [fakturFile, setFakturFile] = React.useState<File | null>(null);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>(
    {},
  );

  // Success dialog
  const [successState, setSuccessState] = React.useState<SuccessState | null>(
    null,
  );

  // Queries & mutations
  const { data: products = [], isLoading } = usePOBProducts(
    outletId,
    debouncedSearch,
  );
  const stockInMutation = usePOBStockIn();
  const stockReturnMutation = usePOBStockReturn();
  const uploadMutation = usePOBUploadFaktur();

  const isSubmitting =
    stockInMutation.isPending ||
    stockReturnMutation.isPending ||
    uploadMutation.isPending;

  // Derived
  const cartItems = React.useMemo(() => Object.values(cart), [cart]);
  const cartQuantities = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const [id, item] of Object.entries(cart)) {
      map[id] = item.quantity;
    }
    return map;
  }, [cart]);
  const totalEstimate = React.useMemo(
    () => cartItems.reduce((sum, i) => sum + i.quantity * i.hppPerUnit, 0),
    [cartItems],
  );

  const isPurchase = referenceType === "PURCHASE";

  // Handlers
  const handleAddToCart = React.useCallback((product: POBProduct) => {
    if (!product.goods) {
      toast.error("Produk ini tidak memiliki data barang");
      return;
    }

    setCart((prev) => {
      const existing = prev[product.id];
      return {
        ...prev,
        [product.id]: {
          product,
          quantity: (existing?.quantity ?? 0) + 1,
          hppPerUnit: existing?.hppPerUnit ?? product.goods?.averageHpp ?? 0,
        },
      };
    });
  }, []);

  const handleScanBarcode = React.useCallback(
    (barcode: string) => {
      const found = products.find(
        (p) => p.goods?.barcode && p.goods.barcode === barcode,
      );
      if (found) {
        handleAddToCart(found);
      } else {
        toast.error(`Barang dengan barcode "${barcode}" tidak ditemukan`);
      }
    },
    [products, handleAddToCart],
  );

  const handleIncrementFromCatalog = React.useCallback(
    (product: POBProduct) => {
      if (!product.goods) return;
      setCart((prev) => {
        const existing = prev[product.id];
        if (!existing) return prev;
        return {
          ...prev,
          [product.id]: { ...existing, quantity: existing.quantity + 1 },
        };
      });
    },
    [],
  );

  const handleDecrementFromCatalog = React.useCallback((productId: string) => {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [productId]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  }, []);

  const handleUpdateQuantity = React.useCallback(
    (productId: string, quantity: number) => {
      setCart((prev) => {
        const item = prev[productId];
        if (!item) return prev;
        return { ...prev, [productId]: { ...item, quantity } };
      });
    },
    [],
  );

  const handleUpdateHpp = React.useCallback(
    (productId: string, hpp: number) => {
      setCart((prev) => {
        const item = prev[productId];
        if (!item) return prev;
        return { ...prev, [productId]: { ...item, hppPerUnit: hpp } };
      });
    },
    [],
  );

  const handleUpdateExpiry = React.useCallback(
    (productId: string, expiry: string) => {
      setCart((prev) => {
        const item = prev[productId];
        if (!item) return prev;
        return {
          ...prev,
          [productId]: { ...item, expiryDate: expiry || undefined },
        };
      });
    },
    [],
  );

  const handleRemove = React.useCallback((productId: string) => {
    setCart((prev) => {
      const { [productId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const handleClear = React.useCallback(() => setCart({}), []);

  const resetForm = React.useCallback(() => {
    setCart({});
    setReferenceId("");
    setNotes("");
    setFakturFile(null);
    setFormErrors({});
  }, []);

  const validate = React.useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!referenceId.trim()) {
      errors.referenceId = "Nama supplier wajib diisi";
    }
    if (!fakturFile) {
      errors.faktur = "Faktur wajib diupload";
    }
    if (cartItems.length === 0) {
      toast.error("Pilih minimal 1 barang");
      return false;
    }
    if (isPurchase) {
      const missingHpp = cartItems.find(
        (i) => !i.hppPerUnit || i.hppPerUnit <= 0,
      );
      if (missingHpp) {
        toast.error(`HPP untuk "${missingHpp.product.name}" belum diisi`);
        return false;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [referenceId, fakturFile, cartItems, isPurchase]);

  const handleSubmit = React.useCallback(async () => {
    if (!validate()) return;

    try {
      // Upload faktur
      const uploadResult = await uploadMutation.mutateAsync(fakturFile!);
      const fakturUrl = uploadResult.url;

      if (isPurchase) {
        const payload = cartItems.map((item) => ({
          productGoodsId: item.product.goods!.id,
          quantity: item.quantity,
          hppPerUnit: item.hppPerUnit,
          notes: notes.trim() || undefined,
          referenceType,
          referenceId: referenceId.trim(),
          faktur: fakturUrl,
          expiryDate: item.expiryDate || undefined,
        }));
        await stockInMutation.mutateAsync(payload);
      } else {
        const payload = cartItems.map((item) => ({
          productGoodsId: item.product.goods!.id,
          quantity: item.quantity,
          notes: notes.trim() || undefined,
          referenceType,
          referenceId: referenceId.trim(),
          faktur: fakturUrl,
          expiryDate: item.expiryDate || undefined,
        }));
        await stockReturnMutation.mutateAsync(payload);
      }

      setSuccessState({
        type: referenceType as "PURCHASE" | "RETURN",
        itemCount: cartItems.length,
        totalAmount: totalEstimate,
      });
      resetForm();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ??
        error?.message ??
        "Gagal menyimpan data stok";
      toast.error(msg);
    }
  }, [
    validate,
    fakturFile,
    isPurchase,
    cartItems,
    notes,
    referenceType,
    referenceId,
    totalEstimate,
    uploadMutation,
    stockInMutation,
    stockReturnMutation,
    resetForm,
  ]);

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-6 p-4 md:p-6">
      {/* Main Layout Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">
        {/* Left Side: Product Catalog */}
        <Card className="rounded-lg pb-0 gap-0 shadow-sm border border-border">
          <CardHeader className="flex justify-between border-b">
            <CardTitle className="text-sm font-bold tracking-wide">
              Katalog Barang
            </CardTitle>
            <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
              <button
                type="button"
                onClick={() => {
                  if (!isSubmitting) setReferenceType("PURCHASE");
                }}
                disabled={isSubmitting}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-sm transition-all",
                  isPurchase
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                Stok Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isSubmitting) setReferenceType("RETURN");
                }}
                disabled={isSubmitting}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-sm transition-all",
                  !isPurchase
                    ? "bg-background text-orange-600 dark:text-orange-400 shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Undo2 className="h-3.5 w-3.5" />
                Retur Stok
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <ProductCatalog
              products={products}
              isLoading={isLoading}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectProduct={handleAddToCart}
              onIncrementProduct={handleIncrementFromCatalog}
              onDecrementProduct={handleDecrementFromCatalog}
              cartQuantities={cartQuantities}
              onScanBarcode={handleScanBarcode}
            />
          </CardContent>
        </Card>

        {/* Right Side: Transaction Form & Cart */}
        <div className="flex flex-col gap-6">
          {/* Transaction Form */}
          <Card className="rounded-lg pb-0 gap-0 shadow-sm border border-border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold tracking-wide">
                Informasi Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <TransactionInfoForm
                referenceType={referenceType}
                referenceId={referenceId}
                notes={notes}
                fakturFile={fakturFile}
                onReferenceTypeChange={setReferenceType}
                onReferenceIdChange={(v) => {
                  setReferenceId(v);
                  if (v.trim())
                    setFormErrors((e) => ({ ...e, referenceId: "" }));
                }}
                onNotesChange={setNotes}
                onFakturChange={(f) => {
                  setFakturFile(f);
                  if (f) setFormErrors((e) => ({ ...e, faktur: "" }));
                }}
                errors={formErrors}
              />
            </CardContent>
          </Card>

          {/* Cart */}
          <Card className="rounded-lg gap-0 shadow-sm border border-border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold tracking-wide">
                Keranjang {isPurchase ? "Pembelian" : "Retur"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <CartPanel
                items={cartItems}
                transactionType={referenceType as "PURCHASE" | "RETURN"}
                onUpdateQuantity={handleUpdateQuantity}
                onUpdateHpp={handleUpdateHpp}
                onUpdateExpiry={handleUpdateExpiry}
                onRemove={handleRemove}
                onClear={handleClear}
              />

              {cartItems.length > 0 && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    disabled={isSubmitting}
                    className="h-10 text-xs font-bold rounded-md"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={cn(
                      "h-10 text-xs font-bold rounded-md text-white transition-all shadow-sm",
                      isPurchase
                        ? "bg-primary text-primary-foreground hover:bg-primary/95"
                        : "bg-orange-600 hover:bg-orange-500 text-white",
                    )}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-1.5 justify-center">
                        <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                        Menyimpan...
                      </span>
                    ) : isPurchase ? (
                      "Simpan Stok"
                    ) : (
                      "Simpan Retur"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Dialog */}
      <SuccessDialog
        open={!!successState}
        onClose={() => setSuccessState(null)}
        type={successState?.type ?? "PURCHASE"}
        itemCount={successState?.itemCount ?? 0}
        totalAmount={successState?.totalAmount}
      />
    </div>
  );
}
