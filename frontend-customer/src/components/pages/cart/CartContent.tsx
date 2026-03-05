'use client'

import { EmptyState } from "@/components/Base";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppBarV2 } from "@/context/AppBarContextV2";
import { CartItem, useCart } from "@/hooks/useCart";
import { useCartValidation } from "@/hooks/useCartValidation";
import { useTranslations } from "@/hooks/useI18n";
import { BookingSlot } from "@/services/booking-slot";
import { BookingSlotType } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCw, ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CartOutletGroup } from "./CartOutletGroup";
import { OrderSummary } from "./OrderSummary";
import { useRouter } from "next/navigation";
import { useFeatureGuide } from "@/hooks/useFeatureGuide";
import { GuideStep } from "@/providers/FeatureGuideProvider";

export function CartContent() {
    const { items, getTotalItems, getTotalPrice, updateQuantity, updateItem, removeItem } = useCart();
    const { setAppBar } = useAppBarV2();
    const [isSelectedOutlet, setIsSelectedOutlet] = useState<string | null>(null);
    const [showValidationAlert, setShowValidationAlert] = useState(false);
    const router = useRouter();
    const t = useTranslations("cart");

    const cartGuideSteps = useMemo<GuideStep[]>(() => [
        {
            id: "cart-overview",
            title: "Ringkasan keranjang",
            description: "Area ini membantu kamu memilih outlet dan memastikan item siap lanjut checkout.",
            target: '[data-guide-target="cart-page-overview"]',
            placement: "bottom",
            focusPadding: 20,
        },
        {
            id: "cart-rules",
            title: "Peraturan checkout",
            description: "Cek aturan ini dulu agar proses checkout tidak gagal di tahap berikutnya.",
            target: '[data-guide-target="cart-checkout-rules"]',
            placement: "bottom",
            focusPadding: 16,
        },
        {
            id: "cart-outlet-list",
            title: "Daftar item per outlet",
            description: "Pilih outlet yang ingin diproses terlebih dahulu, lalu atur jumlah item sesuai kebutuhan.",
            target: '[data-guide-target="cart-outlet-list"]',
            placement: "right",
            focusPadding: 18,
        },
        {
            id: "cart-order-summary",
            title: "Lanjut ke checkout",
            description: "Setelah outlet dipilih dan item valid, gunakan tombol ini untuk melanjutkan pembayaran.",
            target: '[data-guide-target="cart-proceed-checkout"]',
            placement: "left",
            focusPadding: 18,
        },
    ], []);

    useFeatureGuide({
        id: "cart-page-guide",
        steps: cartGuideSteps,
        autoStart: true,
        runOnceKey: "guide:cart-page",
        delay: 900,
        enabled: items.length > 0,
    });

    // Optimized handlers with useCallback
    const handleUpdateQuantity = useCallback((id: string, qty: number) => {
        updateQuantity(id, qty);
    }, [updateQuantity]);

    const handleRemoveItem = useCallback((id: string) => {
        removeItem(id);
    }, [removeItem]);

    const handleUpdateSlot = useCallback((itemId: string, slotId: string) => {
        updateItem(itemId, { selectedSlot: slotId });
    }, [updateItem]);

    const {
        isValidating,
        hasInvalidItems,
        invalidItemsCount,
        validItemsCount,
        removeInvalidItems,
        isItemValid,
        getInvalidReason,
        revalidate
    } = useCartValidation({
        enabled: true,
        refetchInterval: 5 * 60 * 1000,
        onInvalidItemsFound: () => setShowValidationAlert(true)
    });

    useEffect(() => {
        setAppBar({
            title: t("pageTitle"),
            showBackButton: false,
        });
    }, [setAppBar, t]);

    const uniqueSlotIds = useMemo(() => {
        const slotIds = items
            .filter(item => item.type === 'SERVICE' && item.selectedSlot)
            .map(item => item.selectedSlot!);
        return [...new Set(slotIds)].sort();
    }, [items]);

    // 2. Fetch Slots
    const { data: slotDetails, isError } = useQuery({
        queryKey: ['bookingSlots', uniqueSlotIds],
        queryFn: async () => {
            if (uniqueSlotIds.length === 0) return {};
            const slots = await Promise.all(
                uniqueSlotIds.map(id => BookingSlot.getById(id))
            );
            return slots.reduce((acc, slot) => {
                if (slot) acc[slot.id] = slot;
                return acc;
            }, {} as Record<string, BookingSlotType>);
        },
        enabled: uniqueSlotIds.length > 0,
        placeholderData: {},
        staleTime: 1000 * 60, // Cache for 1 minute
    });

    // 3. Optimized Grouping Logic
    const cartState = useMemo(() => {
        const grouped: Record<string, { outletName: string; outletSlug: string; items: CartItem[] }> = {};

        let unscheduledExists = false;
        let unavailableExists = false;

        items.forEach(item => {
            // Grouping
            if (!grouped[item.outletId]) {
                grouped[item.outletId] = { outletName: item.outletName, outletSlug: item.slug, items: [] };
            }
            grouped[item.outletId].items.push(item);

            // Validation Checks
            if (item.type === 'SERVICE') {
                if (!item.selectedSlot) unscheduledExists = true;
                else if (slotDetails && slotDetails[item.selectedSlot] && slotDetails[item.selectedSlot].status !== 'AVAILABLE') {
                    unavailableExists = true;
                }
            }
        });

        // Calculate selected outlet stats
        let selectedTotal = 0;
        let selectedItemsCount = 0;
        let selectedOutletNameStr = "";
        let selectedItemsList: CartItem[] = [];

        if (isSelectedOutlet) {
            selectedItemsList = items.filter(item => item.outletId === isSelectedOutlet);
            selectedTotal = selectedItemsList.reduce((total, item) => total + (item.price * item.quantity), 0);
            selectedItemsCount = selectedItemsList.reduce((total, item) => total + item.quantity, 0);
            if (selectedItemsList.length > 0) {
                selectedOutletNameStr = selectedItemsList[0].outletName;
            }
        }

        return {
            itemsByOutlet: grouped,
            hasUnscheduledServices: unscheduledExists || unavailableExists,
            totalItems: getTotalItems(),
            totalPrice: getTotalPrice(),
            selectedOutletTotal: selectedTotal,
            selectedOutletItems: selectedItemsCount,
            selectedOutletName: selectedOutletNameStr,
            selectedItemsList: selectedItemsList
        };
    }, [items, getTotalItems, getTotalPrice, slotDetails, isSelectedOutlet]);

    // Safe default for slotDetails to prevent passing undefined
    const safeSlotDetails = slotDetails || {};

    if (items.length === 0) {
        return (
            <EmptyState
                title={t("empty.title")}
                description={t("empty.description")}
                icon={<ShoppingCart className="w-16 h-16" />}
                action={{ label: t("empty.action"), onClick: () => router.push("/") }}
            />
        );
    }

    return (
        <div className="py-2" data-guide-target="cart-page-overview">
            {/* Validation Alert */}
            {showValidationAlert && hasInvalidItems && (
                <Card className="mb-4 border-destructive bg-destructive/5 p-0">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-medium text-destructive">
                                    {invalidItemsCount} item{invalidItemsCount > 1 ? 's' : ''} no longer available
                                </h4>
                                <div className="flex gap-2 mt-3">
                                    <Button size="sm" variant="destructive" onClick={removeInvalidItems}>
                                        Remove Unavailable Items
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setShowValidationAlert(false)}>
                                        Dismiss
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Loading Indicator */}
            {isValidating && items.length > 0 && (
                <Card className="mb-4 bg-blue-50 border-blue-200">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2 text-blue-600 text-sm">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Checking item availability...</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {isError && (
                <div className="mb-4 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                    {t("error.slotLoadFailed")}
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-4 items-start">
                <div className="lg:col-span-2 space-y-2">
                    {/* Rules Card */}
                    <Card className="bg-blue-50 border p-0 border-blue-200 dark:bg-blue-900/40 dark:border-blue-700 rounded-md shadow-sm" data-guide-target="cart-checkout-rules">
                        <CardContent className='p-3'>
                            <div className="flex items-start gap-3">
                                <div>
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-200 text-sm">
                                        {t("checkoutRules.title")}
                                    </h3>
                                    <ul className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
                                        <li>{t("checkoutRules.rules.1")}</li>
                                        <li>{t("checkoutRules.rules.2")}</li>
                                        <li>{t("checkoutRules.rules.3")}</li>
                                    </ul>
                                    {hasInvalidItems && (
                                        <div className="mt-2 pt-2 border-t border-blue-300 dark:border-blue-600">
                                            <p className="text-xs text-blue-600 dark:text-blue-300 font-medium">
                                                ⚠️ {validItemsCount} available • {invalidItemsCount} unavailable
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Outlet Groups */}
                    <div data-guide-target="cart-outlet-list" className="space-y-2">
                        {Object.entries(cartState.itemsByOutlet).reverse().map(([outletId, { outletName, outletSlug, items: outletItems }]) => (
                            <CartOutletGroup
                                key={outletId}
                                outletSlug={outletSlug}
                                outletName={outletName}
                                items={outletItems}
                                isSelected={isSelectedOutlet === outletId}
                                onSelectOutlet={setIsSelectedOutlet}
                                onRevalidate={revalidate}
                                isValidating={isValidating}
                                slotDetails={safeSlotDetails}
                                isItemValid={isItemValid}
                                getInvalidReason={getInvalidReason}
                                onUpdateQuantity={handleUpdateQuantity}
                                onRemoveItem={handleRemoveItem}
                                onUpdateSlot={handleUpdateSlot}
                            />
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <OrderSummary
                        totalPrice={cartState.totalPrice}
                        totalItems={cartState.totalItems}
                        outletCount={Object.keys(cartState.itemsByOutlet).length}
                        hasUnscheduledServices={cartState.hasUnscheduledServices}
                        selectedOutletId={isSelectedOutlet}
                        onSelectOutlet={setIsSelectedOutlet}
                        selectedOutletTotal={cartState.selectedOutletTotal}
                        selectedOutletItems={cartState.selectedOutletItems}
                        selectedOutletName={cartState.selectedOutletName}
                        selectedOutletItemsList={cartState.selectedItemsList}
                    />
                </div>
            </div>
        </div>
    );
}