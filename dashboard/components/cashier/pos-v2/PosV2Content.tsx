"use client";

import React from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCashierContext } from "@/components/cashier/layout/CashierLayoutClient";
import { useQueryClient } from "@tanstack/react-query";
import {
    usePosV2Products,
    usePosV2CashSummary,
    usePosV2RecentOrders,
    usePosV2CreateOrder,
    usePosV2OutletQris,
} from "@/hooks/api/use-pos-v2";
import { useLoyaltyConfig } from "@/hooks/api/use-loyalty";
import type { PosV2Product, PosV2OrderResult } from "@/lib/apis/pos-v2";
import { ProductCatalog } from "./ProductCatalog";
import { CartPanel, type CartLine } from "./CartPanel";
import { CustomerInfo } from "./CustomerInfo";
import { PaymentSection, type PaymentMethodType } from "./PaymentSection";
import { CashSummaryBar } from "./CashSummaryBar";
import { OrderSuccessDialog } from "./OrderSuccessDialog";
import { RecentOrders } from "./RecentOrders";
import { ServiceScheduleDialog, type ScheduleSelection } from "./ServiceScheduleDialog";

interface ScheduleDialogState {
    product: PosV2Product;
    selection: ScheduleSelection | null;
}

export function PosV2Content() {
    const { cashierData, outletData } = useCashierContext();
    const outletId = outletData?.id as string;
    const queryClient = useQueryClient();

    // State
    const [searchQuery, setSearchQuery] = React.useState("");
    const [debouncedSearch, setDebouncedSearch] = React.useState("");
    const [cart, setCart] = React.useState<Record<string, CartLine>>({});
    const [isWalkIn, setIsWalkIn] = React.useState(false);
    const [customerName, setCustomerName] = React.useState("");
    const [customerPhone, setCustomerPhone] = React.useState("");
    const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethodType>("cash");
    const [cashReceived, setCashReceived] = React.useState(0);
    const [orderResult, setOrderResult] = React.useState<PosV2OrderResult | null>(null);
    const [scheduleDialog, setScheduleDialog] = React.useState<ScheduleDialogState | null>(null);
    const [member, setMember] = React.useState<any>(null);
    const [pointsRedeemed, setPointsRedeemed] = React.useState(0);

    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Queries
    const { data: productsData, isLoading: productsLoading } = usePosV2Products(
        outletId,
        debouncedSearch || undefined,
    );
    const products = productsData?.products || [];
    const { data: cashSummary, isLoading: summaryLoading } = usePosV2CashSummary(outletId);
    const { data: recentOrders, isLoading: recentLoading } = usePosV2RecentOrders(outletId);
    const { data: outletQris, isLoading: qrisLoading } = usePosV2OutletQris(outletId);
    const { data: loyaltyConfig } = useLoyaltyConfig(outletId);
    const createOrder = usePosV2CreateOrder();

    // Derived state
    const cartItems = React.useMemo(() => Object.values(cart), [cart]);
    const subtotal = React.useMemo(
        () => cartItems.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
        [cartItems],
    );

    const loyaltyDiscount = React.useMemo(() => {
        const config = loyaltyConfig as any;
        if (!config?.isActive || !config?.pointValue) return 0;
        return pointsRedeemed * config.pointValue;
    }, [pointsRedeemed, loyaltyConfig]);

    const grandTotal = React.useMemo(() => Math.max(0, subtotal - loyaltyDiscount), [subtotal, loyaltyDiscount]);
    const cartQuantities = React.useMemo(() => {
        const map: Record<string, number> = {};
        for (const [id, line] of Object.entries(cart)) {
            map[id] = line.quantity;
        }
        return map;
    }, [cart]);

    const hasUnscheduledService = React.useMemo(
        () => cartItems.some((l) => l.product.type === "SERVICE" && (!l.bookingSlotId || !l.bookingStart || !l.staffId)),
        [cartItems],
    );

    const canSubmit = React.useMemo(() => {
        if (!cartItems.length) return false;
        if (!isWalkIn && (!customerName.trim() || !customerPhone.trim())) return false;
        if (paymentMethod === "cash" && cashReceived < grandTotal) return false;
        if (paymentMethod === "qris" && !outletQris?.qrisImageUrl) return false;
        if (hasUnscheduledService) return false;
        return true;
    }, [cartItems.length, isWalkIn, customerName, customerPhone, paymentMethod, cashReceived, grandTotal, hasUnscheduledService, outletQris]);

    // Cart handlers
    const handleAddToCart = (product: PosV2Product) => {
        if (product.type === "SERVICE") {
            // Only 1 service per order
            const existingService = cartItems.find((l) => l.product.type === "SERVICE" && l.product.id !== product.id);
            if (existingService) {
                toast.error("Hanya satu layanan per transaksi");
                return;
            }
            // Open schedule dialog
            const existing = cart[product.id];
            setScheduleDialog({
                product,
                selection: existing?.bookingSlotId && existing.bookingStart && existing.bookingEnd && existing.staffId
                    ? { slotId: existing.bookingSlotId, startTimeIso: existing.bookingStart, endTimeIso: existing.bookingEnd, staffId: existing.staffId }
                    : null,
            });
            return;
        }

        // GOODS / TICKET product
        setCart((prev) => {
            const current = prev[product.id]?.quantity ?? 0;

            if (product.type === "GOODS") {
                if ((product.stock ?? 0) > 0 && current + 1 > (product.stock ?? 0)) {
                    toast.error(`Stok "${product.name}" tidak cukup`);
                    return prev;
                }
            } else if (product.type === "TICKET") {
                const available = (product.totalQuota ?? 0) - (product.soldCount ?? 0);
                if (available > 0 && current + 1 > available) {
                    toast.error(`Kuota tiket "${product.name}" tidak cukup`);
                    return prev;
                }
            }

            return {
                ...prev,
                [product.id]: { product, quantity: current + 1 },
            };
        });
    };

    const handleIncrease = (productId: string) => {
        setCart((prev) => {
            const line = prev[productId];
            if (!line) return prev;
            if (line.product.type === "SERVICE") return prev; // service always qty 1

            if (line.product.type === "GOODS") {
                if ((line.product.stock ?? 0) > 0 && line.quantity + 1 > (line.product.stock ?? 0)) {
                    toast.error(`Stok "${line.product.name}" tidak cukup`);
                    return prev;
                }
            } else if (line.product.type === "TICKET") {
                const available = (line.product.totalQuota ?? 0) - (line.product.soldCount ?? 0);
                if (available > 0 && line.quantity + 1 > available) {
                    toast.error(`Kuota tiket "${line.product.name}" tidak cukup`);
                    return prev;
                }
            }

            return { ...prev, [productId]: { ...line, quantity: line.quantity + 1 } };
        });
    };

    const handleDecrease = (productId: string) => {
        setCart((prev) => {
            const line = prev[productId];
            if (!line) return prev;
            if (line.quantity <= 1) {
                const { [productId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [productId]: { ...line, quantity: line.quantity - 1 } };
        });
    };

    const handleRemove = (productId: string) => {
        setCart((prev) => {
            const { [productId]: _, ...rest } = prev;
            return rest;
        });
    };

    const handleClearCart = () => setCart({});

    const handleScheduleService = (productId: string) => {
        const line = cart[productId];
        if (!line) return;
        setScheduleDialog({
            product: line.product,
            selection: line.bookingSlotId && line.bookingStart && line.bookingEnd && line.staffId
                ? { slotId: line.bookingSlotId, startTimeIso: line.bookingStart, endTimeIso: line.bookingEnd, staffId: line.staffId }
                : null,
        });
    };

    const handleScheduleConfirm = (selection: ScheduleSelection) => {
        const product = scheduleDialog?.product;
        if (!product) return;
        setCart((prev) => ({
            ...prev,
            [product.id]: {
                product,
                quantity: 1,
                bookingSlotId: selection.slotId,
                bookingStart: selection.startTimeIso,
                bookingEnd: selection.endTimeIso,
                staffId: selection.staffId,
            },
        }));
        setScheduleDialog(null);
        toast.success("Jadwal layanan tersimpan");
    };

    const resetForm = () => {
        setCart({});
        setCustomerName("");
        setCustomerPhone("");
        setCashReceived(0);
        setIsWalkIn(false);
        setPointsRedeemed(0);
        setMember(null);
    };

    // Reset points when member changes or walk-in toggled
    React.useEffect(() => {
        setPointsRedeemed(0);
    }, [member, isWalkIn]);

    // Submit order
    const handleSubmitOrder = () => {
        if (!canSubmit) return;

        const customer = isWalkIn
            ? { name: "Walk-in", phone: "0000000000" }
            : { name: customerName.trim(), phone: customerPhone.trim() };

        // Find service item for booking data
        const serviceItem = cartItems.find((l) => l.product.type === "SERVICE");

        createOrder.mutate(
            {
                customer,
                outletId,
                items: cartItems.map((line) => ({
                    productId: line.product.id,
                    quantity: line.product.type === "SERVICE" ? 1 : line.quantity,
                })),
                paymentMethod,
                cashReceived,
                pointsRedeemed,
                staffId: serviceItem?.staffId || (cashierData as any)?.id,
                ...(serviceItem?.bookingSlotId && {
                    bookingSlotId: serviceItem.bookingSlotId,
                    bookingDate: serviceItem.bookingStart,
                }),
            },
            {
                onSuccess: (result) => {
                    setOrderResult(result);
                    resetForm();
                    // Invalidate loyalty queries to show updated points
                    queryClient.invalidateQueries({
                        queryKey: ["loyalty", "members", outletId],
                    });
                    toast.success("Pesanan berhasil dibuat!");
                },
                onError: (error: any) => {
                    const msg = error?.response?.data?.message || error?.message || "Gagal membuat pesanan";
                    toast.error(msg);
                },
            },
        );
    };

    return (
        <div className="mx-auto flex w-full max-w-350 flex-col gap-3 p-4">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">
                        {outletData.name} · {outletData.address || "-"}
                    </p>
                </div>
                <CashSummaryBar data={cashSummary} isLoading={summaryLoading} />
            </div>

            {/* Main layout */}
            <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
                {/* Left: Product catalog */}
                <Card className="gap-0 pt-4">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Produk, Layanan & Tiket</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ProductCatalog
                            products={products}
                            isLoading={productsLoading}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onAddToCart={handleAddToCart}
                            cartQuantities={cartQuantities}
                        />
                    </CardContent>
                </Card>

                {/* Right: Cart + Payment */}
                <div className="flex flex-col gap-3">
                    <Card className="gap-0 pt-4">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Keranjang</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CartPanel
                                items={cartItems}
                                onIncrease={handleIncrease}
                                onDecrease={handleDecrease}
                                onRemove={handleRemove}
                                onClear={handleClearCart}
                                onScheduleService={handleScheduleService}
                            />
                        </CardContent>
                    </Card>

                    <Card className="gap-0 pt-4">
                        <CardContent className="space-y-3 pt-4">
                            <CustomerInfo
                                outletId={outletId}
                                isWalkIn={isWalkIn}
                                onWalkInChange={setIsWalkIn}
                                name={customerName}
                                onNameChange={setCustomerName}
                                phone={customerPhone}
                                onPhoneChange={setCustomerPhone}
                                onMemberChange={setMember}
                                loyaltyConfig={loyaltyConfig}
                                loyaltyDiscount={loyaltyDiscount}
                                onPointsRedeemedChange={setPointsRedeemed}
                                pointsRedeemed={pointsRedeemed}
                                subtotal={subtotal}
                            />

                            <Separator />

                            <PaymentSection
                                method={paymentMethod}
                                onMethodChange={setPaymentMethod}
                                total={grandTotal}
                                cashReceived={cashReceived}
                                onCashReceivedChange={setCashReceived}
                                qrisImageUrl={outletQris?.qrisImageUrl}
                                isLoadingQris={qrisLoading}
                            />

                            <Button
                                onClick={handleSubmitOrder}
                                disabled={!canSubmit || createOrder.isPending}
                                className="w-full py-6 text-base font-semibold">
                                {createOrder.isPending ? "Memproses..." : `Bayar Rp ${grandTotal.toLocaleString("id-ID")}`}
                            </Button>

                            {!canSubmit && cartItems.length > 0 && (
                                <p className="text-center text-xs text-destructive">
                                    {hasUnscheduledService
                                        ? "Pilih jadwal layanan terlebih dahulu"
                                        : "Lengkapi data pelanggan dan nominal pembayaran"}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent orders */}
                    <Card className="gap-0 pt-4">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Transaksi Terakhir</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RecentOrders orders={recentOrders} isLoading={recentLoading} />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Success Dialog */}
            <OrderSuccessDialog
                open={!!orderResult}
                result={orderResult}
                onClose={() => setOrderResult(null)}
            />

            {/* Service Schedule Dialog */}
            <ServiceScheduleDialog
                open={!!scheduleDialog}
                product={scheduleDialog?.product ?? null}
                existingSelection={scheduleDialog?.selection}
                onClose={() => setScheduleDialog(null)}
                onConfirm={handleScheduleConfirm}
            />
        </div>
    );
}
