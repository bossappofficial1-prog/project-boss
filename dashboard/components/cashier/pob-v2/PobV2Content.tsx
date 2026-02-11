"use client";

import React from "react";
import { toast } from "sonner";
import { Package, ArrowDownToLine, Undo2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCashierContext } from "@/app/cashier/layout";
import {
    usePOBProducts,
    usePOBStockIn,
    usePOBStockReturn,
    usePOBUploadFaktur,
    type POBProduct,
    type POBCartItem,
} from "@/hooks/api/use-pob-v2";
import { ProductCatalog } from "./ProductCatalog";
import { CartPanel } from "./CartPanel";
import { TransactionInfoForm } from "./TransactionInfoForm";
import { SuccessDialog } from "./SuccessDialog";

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
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

    // Success dialog
    const [successState, setSuccessState] = React.useState<SuccessState | null>(null);

    // Queries & mutations
    const { data: products = [], isLoading } = usePOBProducts(outletId, debouncedSearch);
    const stockInMutation = usePOBStockIn();
    const stockReturnMutation = usePOBStockReturn();
    const uploadMutation = usePOBUploadFaktur();

    const isSubmitting = stockInMutation.isPending || stockReturnMutation.isPending || uploadMutation.isPending;

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

    const handleIncrementFromCatalog = React.useCallback((product: POBProduct) => {
        if (!product.goods) return;
        setCart((prev) => {
            const existing = prev[product.id];
            if (!existing) return prev;
            return {
                ...prev,
                [product.id]: { ...existing, quantity: existing.quantity + 1 },
            };
        });
    }, []);

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

    const handleUpdateQuantity = React.useCallback((productId: string, quantity: number) => {
        setCart((prev) => {
            const item = prev[productId];
            if (!item) return prev;
            return { ...prev, [productId]: { ...item, quantity } };
        });
    }, []);

    const handleUpdateHpp = React.useCallback((productId: string, hpp: number) => {
        setCart((prev) => {
            const item = prev[productId];
            if (!item) return prev;
            return { ...prev, [productId]: { ...item, hppPerUnit: hpp } };
        });
    }, []);

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
            const missingHpp = cartItems.find((i) => !i.hppPerUnit || i.hppPerUnit <= 0);
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
            const msg = error?.response?.data?.message ?? error?.message ?? "Gagal menyimpan data stok";
            toast.error(msg);
        }
    }, [
        validate, fakturFile, isPurchase, cartItems, notes,
        referenceType, referenceId, totalEstimate,
        uploadMutation, stockInMutation, stockReturnMutation, resetForm,
    ]);

    return (
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 p-4">
            {/* Header */}
            <header className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                        <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Pembelian Stok</h1>
                        <p className="text-sm text-muted-foreground">
                            Input barang masuk / keluar untuk {outletData?.name}
                        </p>
                    </div>
                </div>
            </header>

            {/* Transaction Type Badge */}
            <div className="flex items-center gap-2">
                <Badge
                    variant={isPurchase ? "default" : "secondary"}
                    className={`gap-1.5 px-3 py-1 ${isPurchase ? "bg-green-600 hover:bg-green-500" : "bg-orange-600 hover:bg-orange-500 text-white"}`}
                >
                    {isPurchase ? (
                        <ArrowDownToLine className="h-3.5 w-3.5" />
                    ) : (
                        <Undo2 className="h-3.5 w-3.5" />
                    )}
                    {isPurchase ? "Mode: Pembelian (Stok Masuk)" : "Mode: Pengembalian (Stok Keluar)"}
                </Badge>
            </div>

            {/* Main Layout */}
            <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
                {/* Left: Product Catalog */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Katalog Barang</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ProductCatalog
                            products={products}
                            isLoading={isLoading}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onSelectProduct={handleAddToCart}
                            onIncrementProduct={handleIncrementFromCatalog}
                            onDecrementProduct={handleDecrementFromCatalog}
                            cartQuantities={cartQuantities}
                        />
                    </CardContent>
                </Card>

                {/* Right: Transaction Info + Cart */}
                <div className="flex flex-col gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Informasi Transaksi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TransactionInfoForm
                                referenceType={referenceType}
                                referenceId={referenceId}
                                notes={notes}
                                fakturFile={fakturFile}
                                onReferenceTypeChange={setReferenceType}
                                onReferenceIdChange={(v) => {
                                    setReferenceId(v);
                                    if (v.trim()) setFormErrors((e) => ({ ...e, referenceId: "" }));
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

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                                Keranjang {isPurchase ? "Pembelian" : "Pengembalian"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <CartPanel
                                items={cartItems}
                                transactionType={referenceType as "PURCHASE" | "RETURN"}
                                onUpdateQuantity={handleUpdateQuantity}
                                onUpdateHpp={handleUpdateHpp}
                                onRemove={handleRemove}
                                onClear={handleClear}
                            />

                            {cartItems.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleClear}
                                        disabled={isSubmitting}
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className={isPurchase ? "bg-green-600 hover:bg-green-500" : "bg-orange-600 hover:bg-orange-500"}
                                    >
                                        {isSubmitting
                                            ? "Menyimpan..."
                                            : isPurchase
                                                ? "Simpan Stok"
                                                : "Simpan Pengembalian"
                                        }
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
