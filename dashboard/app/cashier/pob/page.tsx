"use client";

import React from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ProductGridSection } from "@/components/owner/dashboard/pos/ProductGridSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FileUploader from "@/components/ui/ImageUploader";

import { productApi, stockApi, uploadApi } from "@/lib/api";
import type { POSProduct } from "@/types/pos";
import { useCashierContext } from "../layout";

const currencyFormatter = new Intl.NumberFormat("id-ID");

interface POBCartItem {
  product: POSProduct;
  quantity: number;
  hppPerUnit: number;
}

export default function CashierPOBPage() {
  const { outletData } = useCashierContext();

  const [products, setProducts] = React.useState<POSProduct[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [cart, setCart] = React.useState<Record<string, POBCartItem>>({});
  const [isLoadingProducts, setIsLoadingProducts] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Transaction details
  const [referenceType, setReferenceType] = React.useState("PURCHASE"); // PURCHASE, RETURN
  const [referenceId, setReferenceId] = React.useState("");
  const [fakturFile, setFakturFile] = React.useState<File | null>(null);
  const [notes, setNotes] = React.useState("");

  const outletId = outletData?.id;

  const fetchProducts = React.useCallback(
    async (query?: string) => {
      if (!outletId) return;
      setIsLoadingProducts(true);
      try {
        // Only fetch GOODS
        const data = (
          await productApi.getByOutlet(
            outletId,
            {
              search: query?.trim() ? query.trim() : undefined,
              limit: 120,
              type: "GOODS", // Filter only GOODS
            },
            "CASHIER",
          )
        ).data;
        setProducts(data as POSProduct[]);
      } catch (error) {
        console.error("Gagal mengambil produk:", error);
        toast.error("Tidak dapat memuat produk outlet");
      } finally {
        setIsLoadingProducts(false);
      }
    },
    [outletId],
  );

  React.useEffect(() => {
    setSearchQuery("");
    setCart({});
    if (outletId) {
      fetchProducts();
    }
  }, [fetchProducts, outletId]);

  const handleSearch = React.useCallback(() => {
    fetchProducts(searchQuery);
  }, [fetchProducts, searchQuery]);

  const cartQuantities = React.useMemo(() => {
    const map: Record<string, number> = {};
    Object.entries(cart).forEach(([productId, line]) => {
      map[productId] = line.quantity;
    });
    return map;
  }, [cart]);

  const filteredProducts = React.useMemo(() => {
    // Already filtered by type=GOODS from API, but safe to filter again
    const list = products.filter((item) => item.type === "GOODS");
    if (!searchQuery.trim()) {
      return list;
    }
    const query = searchQuery.trim().toLowerCase();
    return list.filter((item) => item.name.toLowerCase().includes(query));
  }, [products, searchQuery]);

  const handleAddProduct = (product: POSProduct) => {
    if (product.type !== "GOODS") {
      toast.error("Hanya produk barang yang dapat dibeli (stock in)");
      return;
    }

    setCart((prev) => {
      const currentLine = prev[product.id];
      const currentQty = currentLine?.quantity ?? 0;
      // Default HPP to current averageHpp or 0 if not set
      const defaultHpp = currentLine?.hppPerUnit ?? product.goods?.averageHpp ?? 0;

      return {
        ...prev,
        [product.id]: {
          product,
          quantity: currentQty + 1,
          hppPerUnit: defaultHpp > 0 ? defaultHpp : 0,
        },
      };
    });
  };

  const handleUpdateCartItem = (productId: string, updates: Partial<POBCartItem>) => {
    setCart((prev) => {
      const line = prev[productId];
      if (!line) return prev;
      return {
        ...prev,
        [productId]: { ...line, ...updates },
      };
    });
  };

  const handleRemoveProduct = (productId: string) => {
    setCart((prev) => {
      const { [productId]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleResetCart = () => {
    setCart({});
    setReferenceId("");
    setNotes("");
    setFakturFile(null);
  };

  const cartItems = React.useMemo(() => Object.values(cart), [cart]);

  const totalEstimate = React.useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity * item.hppPerUnit, 0);
  }, [cartItems]);

  const handleSubmit = async () => {
    if (!cartItems.length) {
      toast.error("Keranjang belanja kosong");
      return;
    }

    try {
      if (!referenceId.trim()) {
        toast.error("Nama supplier wajib diisi");
        return;
      }

      if (!fakturFile) {
        toast.error("Faktur pembelian wajib diupload");
        return;
      }

      setIsSubmitting(true);

      // Upload faktur image if provided
      let fakturUrl: string | undefined;
      if (fakturFile) {
        try {
          const uploadResult = await uploadApi.uploadImage(fakturFile);
          fakturUrl = uploadResult.url;
        } catch (uploadError) {
          console.error("Gagal upload faktur:", uploadError);
          toast.error("Gagal upload gambar faktur");
          setIsSubmitting(false);
          return;
        }
      }

      if (referenceType === "RETURN") {
        // Pengembalian - stock keluar
        const payload = cartItems.map((item) => ({
          productGoodsId: item.product.goods!.id,
          quantity: item.quantity,
          notes: notes.trim() || undefined,
          referenceType: referenceType,
          referenceId: referenceId.trim(),
          faktur: fakturUrl,
        }));

        // Log payload for manual testing
        console.log("[POB] bulkReturn Payload:", JSON.stringify(payload, null, 2));

        const response = await stockApi.bulkReturn(payload);

        // Log response for manual testing
        console.log("[POB] bulkReturn Response:", JSON.stringify(response, null, 2));

        toast.success("Pengembalian stok berhasil dicatat");
      } else {
        // Pembelian - stock masuk
        const payload = cartItems.map((item) => ({
          productGoodsId: item.product.goods!.id,
          quantity: item.quantity,
          hppPerUnit: item.hppPerUnit,
          notes: notes.trim() || undefined,
          referenceType: referenceType,
          referenceId: referenceId.trim(),
          faktur: fakturUrl,
        }));

        // Log payload for manual testing
        console.log("[POB] bulkIn Payload:", JSON.stringify(payload, null, 2));

        const response = await stockApi.bulkIn(payload);

        // Log response for manual testing
        console.log("[POB] bulkIn Response:", JSON.stringify(response, null, 2));

        toast.success("Stok berhasil ditambahkan");
      }

      handleResetCart();
      fetchProducts(searchQuery); // Refresh products (stock counts)
    } catch (error) {
      console.error("Gagal input stock:", error);
      toast.error("Gagal menyimpan data stok");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="text-slate-900 transition-colors dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 p-4">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold">Pembelian Stok (POB)</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Input barang masuk (membeli stok) untuk outlet {outletData.name}
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <ProductGridSection
            filteredProducts={filteredProducts}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onSearch={handleSearch}
            activeFilter="GOODS"
            hideFilters={true}
            onFilterChange={() => {}} // Disable filter change
            isLoading={isLoadingProducts}
            onAddProduct={handleAddProduct}
            cartQuantities={cartQuantities}
          />

          <section className="flex flex-col gap-4">
            <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Informasi Transaksi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Tipe Transaksi</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                    value={referenceType}
                    onChange={(e) => setReferenceType(e.target.value)}>
                    <option value="PURCHASE">Pembelian (Stok Masuk)</option>
                    <option value="RETURN">Pengembalian (Stok Keluar)</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Supplier</Label>
                  <Input
                    placeholder="Contoh: Toko ABC"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Catatan</Label>
                  <Textarea
                    placeholder="Catatan tambahan..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Faktur Pembelian</Label>
                  <FileUploader
                    value={fakturFile}
                    onValueChange={setFakturFile}
                    accept={{ "image/*": [".jpeg", ".png", ".jpg", ".webp"] }}
                    maxSize={5 * 1024 * 1024}
                    label="Upload gambar faktur"
                    helperText="Format: JPG, PNG, WEBP (Maks 5MB)"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-1 flex-col border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Keranjang Pembelian</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pastikan HPP (Harga Beli) sesuai dengan faktur.
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="space-y-3">
                  {cartItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-400">
                      Belum ada barang dipilih.
                    </div>
                  ) : (
                    cartItems.map((line) => (
                      <div
                        key={line.product.id}
                        className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                              {line.product.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              Stok Saat Ini: {line.product.goods?.currentStock || 0}{" "}
                              {line.product.goods?.unit || "Unit"}
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-slate-400 hover:text-red-500"
                            onClick={() => handleRemoveProduct(line.product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500">Qty Masuk</Label>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() =>
                                  handleUpdateCartItem(line.product.id, {
                                    quantity: Math.max(1, line.quantity - 1),
                                  })
                                }>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                min={1}
                                className="h-8 text-center"
                                value={line.quantity}
                                onChange={(e) =>
                                  handleUpdateCartItem(line.product.id, {
                                    quantity: parseInt(e.target.value) || 1,
                                  })
                                }
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() =>
                                  handleUpdateCartItem(line.product.id, {
                                    quantity: line.quantity + 1,
                                  })
                                }>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500">HPP / Unit (Rp)</Label>
                            <Input
                              type="number"
                              min={0}
                              className="h-8 text-right"
                              value={line.hppPerUnit}
                              onChange={(e) =>
                                handleUpdateCartItem(line.product.id, {
                                  hppPerUnit: parseFloat(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          Subtotal: Rp {currencyFormatter.format(line.quantity * line.hppPerUnit)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Separator className="border-slate-200 dark:border-slate-800" />

                <div className="flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <span>Total Estimasi</span>
                  <span>Rp {currencyFormatter.format(totalEstimate)}</span>
                </div>

                <div className="mt-auto flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="secondary"
                      onClick={handleResetCart}
                      disabled={!cartItems.length}>
                      Reset
                    </Button>
                    <Button onClick={handleSubmit} disabled={!cartItems.length || isSubmitting}>
                      {isSubmitting ? "Menyimpan..." : "Simpan Stok"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
