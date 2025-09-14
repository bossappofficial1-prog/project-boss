"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react'; // Tambahkan useCallback
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ShoppingCart,
    Plus,
    Minus,
    Store,
    CreditCard,
    Trash2,
    X,
    AlertCircle,
    Timer,
    Calendar,
    RefreshCw,
} from 'lucide-react';
import { useCart, CartItem } from '@/hooks/useCart';
import { useCartValidation } from '@/hooks/useCartValidation';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { EmptyState } from '@/components/Base';
import { BookingSlotType } from '@/types';
import { BookingSlot } from '@/services/booking-slot';
import { CheckoutService } from '@/services/checkout';
import { id } from 'date-fns/locale';
import { ScheduleModal } from '@/components/outlet/ScheduleModal';
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link';
import { useTranslations } from "@/hooks/useI18n";
import { useAppBarV2 } from '@/context/AppBarContextV2';

function formatSelectedSlot(dateStr: string, startTimeStr: string, endTimeStr: string) {
    const date = parseISO(dateStr);
    const startTime = parseISO(startTimeStr);
    const endTime = parseISO(endTimeStr);
    return {
        date: format(date, "EEEE, dd MMMM yyyy", { locale: id }),
        time: `${format(startTime, "HH:mm")} - ${format(endTime, "HH:mm")}`
    };
}

interface CartItemProps {
    item: CartItem;
    slotInfo?: BookingSlotType | null;
    isValid?: boolean;
    invalidReason?: string | null;
}

function CartItemCard({ item, slotInfo, isValid = true, invalidReason }: CartItemProps) {
    const { updateQuantity, updateItem, removeItem } = useCart();
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const isService = item.type === "SERVICE";
    const t = useTranslations("cart");

    const handleScheduleSelect = (schedule: string | BookingSlot) => {
        const slotId = typeof schedule === 'string' ? schedule : (schedule as any).id;
        if (!slotId) return;
        updateItem(item.id, { selectedSlot: slotId });
        setShowScheduleModal(false);
    };

    const ScheduleInfo = () => {
        if (!isService) return null;

        if (slotInfo) {
            const { date, time } = formatSelectedSlot(slotInfo.date, slotInfo.startTime, slotInfo.endTime);
            const isAvailable = slotInfo.status === "AVAILABLE";
            return (
                <div className="mt-2 space-y-2">
                    <div className="flex items-start justify-between gap-2 p-2 rounded-md bg-secondary/50 border">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary shrink-0" />
                            <div>
                                <p className="text-xs font-semibold">{date}</p>
                                <p className="text-xs text-muted-foreground">{time}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5" title={isAvailable ? t("schedule.slotAvailable") : t("schedule.slotUnavailable")}>
                            <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className={`text-xs font-semibold ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>{isAvailable ? t("schedule.available") : t("schedule.unavailable")}</span>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full h-8" onClick={() => setShowScheduleModal(true)}>
                        <Timer className="w-3 h-3 mr-2" />
                        {t("schedule.changeSchedule")}
                    </Button>
                </div>
            );
        }

        return (
            <div className="mt-2">
                <Button className="w-full" variant="destructive" onClick={() => setShowScheduleModal(true)}>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {t("schedule.selectSchedule")}
                </Button>
            </div>
        );
    };

    return (
        <div className={`p-4 border-b last:border-b-0 ${!isValid ? 'bg-destructive/5 border-destructive/20' : ''}`}>
            {/* Validation warning */}
            {!isValid && invalidReason && (
                <div className="mb-3 p-2 rounded-md bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">Item Unavailable</span>
                    </div>
                    <p className="text-xs text-destructive/80 mt-1">{invalidReason}</p>
                </div>
            )}

            <div className="flex gap-4">
                <div className="relative">
                    <img
                        src={item.image || '/assets/images/default-image.png'}
                        alt={item.name}
                        className={`w-16 h-16 rounded-lg object-cover bg-muted flex-shrink-0 ${!isValid ? 'opacity-50' : ''}`}
                    />
                    {!isValid && (
                        <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-destructive" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className={`font-semibold text-sm line-clamp-2 ${!isValid ? 'text-muted-foreground' : ''}`}>
                                {item.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">{item.outletName}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex justify-between items-end mt-2">
                        {isService ? (
                            <Badge variant="outline">{t("service")}</Badge>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1 || !isValid}
                                >
                                    <Minus className="h-3.5 w-3.5" />
                                </Button>
                                <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    disabled={!!(item.maxQuantity && item.quantity >= item.maxQuantity) || !isValid}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}
                        <div className="text-right">
                            <p className={`font-bold text-base ${!isValid ? 'text-muted-foreground line-through' : 'text-primary'}`}>
                                Rp{(item.price * item.quantity).toLocaleString('id-ID')}
                            </p>
                            {item.quantity > 1 && !isService && (
                                <p className="text-xs text-muted-foreground">
                                    Rp {item.price.toLocaleString('id-ID')}
                                </p>
                            )}
                        </div>
                    </div>

                    <ScheduleInfo />
                </div>
            </div>

            {showScheduleModal && (
                <ScheduleModal
                    isOpen={showScheduleModal}
                    onClose={() => setShowScheduleModal(false)}
                    onSelectSchedule={(slot) => { handleScheduleSelect(slot as any) }}
                    product={{ ...item, id: item.productId }}
                    outletId={item.outletId}
                />
            )}
        </div>
    );
}


interface OrderSummaryProps {
    totalPrice: number;
    totalItems: number;
    outletCount: number;
    hasUnscheduledServices: boolean;
    selectedOutletId: string | null;
    onSelectOutlet: (outletId: string | null) => void;
    selectedOutletTotal: number;
    selectedOutletItems: number;
}

function OrderSummary({ totalPrice, totalItems, outletCount, hasUnscheduledServices, selectedOutletId, onSelectOutlet, selectedOutletTotal, selectedOutletItems }: OrderSummaryProps) {
    const router = useRouter();
    const { items } = useCart();
    const t = useTranslations("cart");

    const handleCheckout = async () => {
        if (hasUnscheduledServices) return;

        // Validasi: hanya satu outlet yang dipilih
        if (!selectedOutletId) {
            alert(t("validation.selectOutlet"));
            return;
        }

        try {
            const selectedOutletItems = items.filter(item => item.outletId === selectedOutletId);
            const checkoutData = await CheckoutService.prepareCheckoutData(selectedOutletItems);
            CheckoutService.saveCheckoutDataToStorage(checkoutData);
            router.push('/checkout');
        } catch (error) {
            alert(t("validation.checkoutError"));
        }
    };

    return (
        <div className="sticky space-y-2">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-xl">{t("summary")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-muted-foreground">
                        <span className="text-sm">{t("subtotal")} ({selectedOutletId ? selectedOutletItems : totalItems} {t("items")}{selectedOutletId && selectedOutletItems !== 1 ? 's' : ''})</span>
                        <span className="text-sm font-medium">Rp{(selectedOutletId ? selectedOutletTotal : totalPrice).toLocaleString('id-ID')}</span>
                    </div>
                    {/* Placeholder for discounts, etc. */}
                    <div className="pt-4 border-t">
                        <div className="flex items-baseline justify-between">
                            <span className="font-semibold">{t("orderSummary.totalPayment")}</span>
                            <span className="font-bold text-xl text-primary">Rp{(selectedOutletId ? selectedOutletTotal : totalPrice).toLocaleString('id-ID')}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {selectedOutletId
                                ? t("orderSummary.fromOutlet", { outletName: items.find(item => item.outletId === selectedOutletId)?.outletName || "" })
                                : t("orderSummary.fromOutlets", { count: outletCount })
                            }
                        </p>
                    </div>

                    {/* Informasi Outlet yang Dipilih */}
                    {selectedOutletId ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-green-800">{t("outlet.selectedOutlet")}</p>
                                    <p className="text-xs text-green-600 mt-1">
                                        {items.find(item => item.outletId === selectedOutletId)?.outletName}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onSelectOutlet(null)}
                                    className="text-xs h-6"
                                >
                                    {t("outlet.cancel")}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-yellow-800">{t("outlet.chooseOutlet")}</p>
                            <p className="text-xs text-yellow-600 mt-1">
                                {t("outlet.chooseOutletDescription")}
                            </p>
                        </div>
                    )}

                    {/* Validasi Jenis Produk */}
                    {selectedOutletId && (() => {
                        const selectedOutletProductTypes = [...new Set(items.filter(item => item.outletId === selectedOutletId).map(item => item.type))];
                        return selectedOutletProductTypes.length > 1 ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm font-medium text-red-800">{t("validation.attention")}</p>
                                <p className="text-xs text-red-600 mt-1">
                                    {t("validation.mixedProducts", {
                                        outletName: items.find(item => item.outletId === selectedOutletId)?.outletName || "",
                                        types: selectedOutletProductTypes.join(' dan ')
                                    })}
                                </p>
                            </div>
                        ) : null;
                    })()}

                    <Button
                        size="lg"
                        className="w-full text-base"
                        disabled={hasUnscheduledServices || !selectedOutletId || (() => {
                            if (!selectedOutletId) return false;
                            const selectedOutletProductTypes = [...new Set(items.filter(item => item.outletId === selectedOutletId).map(item => item.type))];
                            return selectedOutletProductTypes.length > 1;
                        })()}
                        onClick={handleCheckout}
                    >
                        <CreditCard className="w-5 h-5 mr-2" />
                        {hasUnscheduledServices ? t("buttons.completeScheduleFirst") :
                            !selectedOutletId ? t("buttons.selectOutletFirst") :
                                (() => {
                                    if (!selectedOutletId) return t("buttons.selectOutletFirst");
                                    const selectedOutletProductTypes = [...new Set(items.filter(item => item.outletId === selectedOutletId).map(item => item.type))];
                                    return selectedOutletProductTypes.length > 1 ? t("buttons.selectProductType") : t("buttons.proceedToPayment");
                                })()}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default function CartPage() {
    const { items, getTotalItems, getTotalPrice } = useCart();
    const { setAppBar } = useAppBarV2()
    const [isSelectedOutlet, setIsSelectedOutlet] = useState<string | null>(null)
    const [showValidationAlert, setShowValidationAlert] = useState(false);
    const t = useTranslations("cart");

    // Cart validation hook
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
        refetchInterval: 5 * 60 * 1000, // 5 menit
        onInvalidItemsFound: (invalidItems) => {
            setShowValidationAlert(true);
        }
    });

    const router = useRouter();
    useEffect(() => {
        setAppBar({
            title: t("pageTitle"),
            showBackButton: false,
        })
    }, [setAppBar, t])

    const uniqueSlotIds = useMemo(() => {
        const slotIds = items
            .filter(item => item.type === 'SERVICE' && item.selectedSlot)
            .map(item => item.selectedSlot!);
        return [...new Set(slotIds)].sort();
    }, [items]);

    const { data: slotDetails, isLoading: isLoadingSlots, isError } = useQuery({
        queryKey: ['bookingSlots', uniqueSlotIds],

        queryFn: async () => {
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
    });

    const { itemsByOutlet, hasUnscheduledServices, totalItems, totalPrice, selectedOutletTotal, selectedOutletItems } = useMemo(() => {
        const grouped = items.reduce((acc, item) => {
            if (!acc[item.outletId]) {
                acc[item.outletId] = { outletName: item.outletName, items: [] };
            }
            acc[item.outletId].items.push(item);
            return acc;
        }, {} as Record<string, { outletName: string; items: CartItem[] }>);

        const unscheduledExists = items.some(item => item.type === 'SERVICE' && !item.selectedSlot);
        const unavailableExists = items.some(item =>
            item.type === 'SERVICE' &&
            item.selectedSlot &&
            slotDetails &&
            slotDetails[item.selectedSlot] &&
            slotDetails[item.selectedSlot].status !== 'AVAILABLE'
        );

        // Hitung total untuk outlet yang dipilih
        let selectedTotal = 0;
        let selectedItems = 0;
        if (isSelectedOutlet) {
            const selectedItemsList = items.filter(item => item.outletId === isSelectedOutlet);
            selectedTotal = selectedItemsList.reduce((total, item) => total + (item.price * item.quantity), 0);
            selectedItems = selectedItemsList.reduce((total, item) => total + item.quantity, 0);
        }

        return {
            itemsByOutlet: grouped,
            hasUnscheduledServices: unscheduledExists || unavailableExists,
            totalItems: getTotalItems(),
            totalPrice: getTotalPrice(),
            selectedOutletTotal: selectedTotal,
            selectedOutletItems: selectedItems,
        };
    }, [items, getTotalItems, getTotalPrice, slotDetails, isSelectedOutlet]);

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
        <div className="py-2">
            {/* Cart Validation Alert */}
            {showValidationAlert && hasInvalidItems && (
                <Card className="mb-4 border-destructive bg-destructive/5 p-0">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="font-medium text-destructive">
                                    {invalidItemsCount} item{invalidItemsCount > 1 ? 's' : ''} no longer available
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Some items in your cart may have been removed or are out of stock.
                                </p>
                                <div className="flex gap-2 mt-3">
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={removeInvalidItems}
                                    >
                                        Remove Unavailable Items
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowValidationAlert(false)}
                                    >
                                        Dismiss
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Validation loading indicator */}
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
                    {/* Cart summary dengan validasi */}
                    <Card className="bg-blue-50 border border-blue-200 dark:bg-blue-900/40 dark:border-blue-700 rounded-lg shadow-sm transition-colors duration-300">
                        <CardContent>
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


                    {Object.entries(itemsByOutlet).map(([outletId, { outletName, items: outletItems }]) => (
                        <Card key={outletId} onClick={() => setIsSelectedOutlet(outletId)} className={`pt-0 py-0 overflow-hidden cursor-pointer transition-all ${isSelectedOutlet === outletId ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:border-primary/50"}`}>
                            <CardHeader className="bg-muted/50 pt-3 px-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Link
                                        href={`/outlet/${outletId}`}
                                        className='flex items-center gap-2 hover:opacity-85'
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Store className="w-5 h-5 text-primary" />
                                        {outletName}
                                    </Link>
                                    <div className="flex items-center gap-2 ml-auto">
                                        {/* Show refresh button for this outlet */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                revalidate();
                                            }}
                                            disabled={isValidating}
                                            className="text-xs h-6"
                                        >
                                            <RefreshCw className={`w-3 h-3 ${isValidating ? 'animate-spin' : ''}`} />
                                        </Button>
                                        {isSelectedOutlet === outletId && (
                                            <Badge variant="default">
                                                {t("outlet.selected")}
                                            </Badge>
                                        )}
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 divide-y">
                                {outletItems.map((item) => (
                                    <CartItemCard
                                        key={item.id}
                                        item={item}
                                        slotInfo={item.selectedSlot ? slotDetails?.[item.selectedSlot] : null}
                                        isValid={isItemValid(item.id)}
                                        invalidReason={getInvalidReason(item.id)}
                                    />
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="lg:col-span-1">
                    <OrderSummary
                        totalPrice={totalPrice}
                        totalItems={totalItems}
                        outletCount={Object.keys(itemsByOutlet).length}
                        hasUnscheduledServices={hasUnscheduledServices}
                        selectedOutletId={isSelectedOutlet}
                        onSelectOutlet={setIsSelectedOutlet}
                        selectedOutletTotal={selectedOutletTotal}
                        selectedOutletItems={selectedOutletItems}
                    />
                </div>
            </div>
        </div>
    );
}