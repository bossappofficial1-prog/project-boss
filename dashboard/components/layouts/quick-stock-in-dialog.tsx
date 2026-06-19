"use client";

import React, { useRef, useState } from "react";
import { gooeyToast } from "goey-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScanLine, Package, Loader2 } from "lucide-react";
import { useProductBarcodeLookup } from "@/hooks/api/use-product-barcode";
import { stockApi } from "@/lib/apis/stock";
import { DatePicker } from "@/components/ui/date-picker";

interface QuickStockInDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    outletId: string;
}

export function QuickStockInDialog({ open, onOpenChange, outletId }: QuickStockInDialogProps) {
    const [step, setStep] = useState<"SCAN" | "FORM">("SCAN");
    const [barcode, setBarcode] = useState("");
    const [product, setProduct] = useState<{ id: string; name: string; goodsId: string | null; unit: string } | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [hppPerUnit, setHppPerUnit] = useState(0);
    const [expiryDate, setExpiryDate] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const barcodeLookup = useProductBarcodeLookup();

    const reset = () => {
        setStep("SCAN");
        setBarcode("");
        setProduct(null);
        setQuantity(1);
        setHppPerUnit(0);
        setExpiryDate("");
    };

    const setShortcutExpiry = (months: number) => {
        const d = new Date();
        d.setMonth(d.getMonth() + months);
        const formatted = d.toISOString().split("T")[0];
        setExpiryDate(formatted);
    };

    const handleClose = () => {
        reset();
        onOpenChange(false);
    };

    const handleBarcodeSubmit = async () => {
        const code = barcode.trim();
        if (!code) return;

        try {
            const result = await barcodeLookup.mutateAsync({ code, outletId });
            setProduct({
                id: result.id,
                name: result.name,
                goodsId: result.goodsId,
                unit: result.unit || "pcs",
            });
            setStep("FORM");
        } catch (err: any) {
            gooeyToast.error(err?.response?.data?.message || `Barang dengan barcode "${code}" tidak ditemukan`);
            setBarcode("");
            barcodeInputRef.current?.focus();
        }
    };

    const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleBarcodeSubmit();
        }
    };

    const handleSubmitStock = async () => {
        if (!product || !product.goodsId || quantity <= 0 || hppPerUnit <= 0) {
            gooeyToast.error("Quantity dan HPP harus diisi");
            return;
        }

        setSubmitting(true);
        try {
            await stockApi.bulkIn([{
                productGoodsId: product.goodsId,
                quantity,
                hppPerUnit,
                expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
            }]);
            gooeyToast.success(`Stok "${product.name}" berhasil ditambahkan: ${quantity} ${product.unit}`);
            reset();
        } catch (err: any) {
            gooeyToast.error(err?.response?.data?.message || "Gagal menyimpan stok");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Stok Masuk Cepat</DialogTitle>
                    <DialogDescription>
                        Scan barcode barang untuk mencatat stok masuk
                    </DialogDescription>
                </DialogHeader>

                {step === "SCAN" && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-3">
                            <ScanLine className="h-5 w-5 text-primary shrink-0" />
                            <Input
                                ref={barcodeInputRef}
                                placeholder="Scan atau ketik barcode..."
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                onKeyDown={handleBarcodeKeyDown}
                                className="h-10 border-0 bg-transparent px-0 text-base focus-visible:ring-0"
                                autoFocus
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleBarcodeSubmit}
                            disabled={!barcode.trim() || barcodeLookup.isPending}
                        >
                            {barcodeLookup.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <ScanLine className="mr-2 h-4 w-4" />
                            )}
                            Cari Barang
                        </Button>
                    </div>
                )}

                {step === "FORM" && product && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <Package className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">{product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {product.unit}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="qty">Jumlah</Label>
                            <Input
                                id="qty"
                                type="number"
                                min={1}
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="hpp">Harga Modal (HPP) per Unit</Label>
                            <Input
                                id="hpp"
                                type="number"
                                min={0}
                                value={hppPerUnit}
                                onChange={(e) => setHppPerUnit(Number(e.target.value))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expiry">Tanggal Kedaluwarsa (Opsional)</Label>
                            <DatePicker
                                id="expiry"
                                value={expiryDate}
                                onValueChange={(val) => setExpiryDate(val || "")}
                                className="h-10 text-xs"
                                endYear={new Date().getFullYear() + 20}
                            />
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-7 py-1 px-2.5 rounded-md"
                                    onClick={() => setShortcutExpiry(1)}
                                >
                                    +1 Bln
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-7 py-1 px-2.5 rounded-md"
                                    onClick={() => setShortcutExpiry(6)}
                                >
                                    +6 Bln
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-7 py-1 px-2.5 rounded-md"
                                    onClick={() => setShortcutExpiry(12)}
                                >
                                    +1 Thn
                                </Button>
                                {expiryDate && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs h-7 py-1 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => setExpiryDate("")}
                                    >
                                        Batal
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setStep("SCAN")}
                                disabled={submitting}
                            >
                                Kembali
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleSubmitStock}
                                disabled={submitting || quantity <= 0 || hppPerUnit <= 0}
                            >
                                {submitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Simpan Stok
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
