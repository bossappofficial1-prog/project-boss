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
} from 'lucide-react';
import { useCart, CartItem } from '@/hooks/useCart';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { useAppBarConfig } from '@/hooks/useAppBarConfig';
import { EmptyState } from '@/components/Base';
import { BookingSlotType } from '@/types';
import { BookingSlot } from '@/services/booking-slot';
import { CheckoutService } from '@/services/checkout';
import { id } from 'date-fns/locale';
import { ScheduleModal } from '@/components/outlet/ScheduleModal';
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link';

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
}

function CartItemCard({ item, slotInfo }: CartItemProps) {
    const { updateQuantity, updateItem, removeItem } = useCart();
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const isService = item.type === "SERVICE";

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
                        <div className="flex items-center gap-1.5" title={isAvailable ? "Slot tersedia" : "Slot tidak tersedia/sudah dipesan"}>
                            <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className={`text-xs font-semibold ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>{isAvailable ? "Tersedia" : "Penuh"}</span>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full h-8" onClick={() => setShowScheduleModal(true)}>
                        <Timer className="w-3 h-3 mr-2" />
                        Ganti Jadwal
                    </Button>
                </div>
            );
        }

        return (
            <div className="mt-2">
                <Button className="w-full" variant="destructive" onClick={() => setShowScheduleModal(true)}>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Pilih Jadwal Layanan
                </Button>
            </div>
        );
    };

    return (
        <div className="p-4 border-b last:border-b-0">
            <div className="flex gap-4">
                <img
                    src={item.image || '/assets/images/default-image.png'}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover bg-muted flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-sm line-clamp-2">{item.name}</h3>
                            <p className="text-xs text-muted-foreground">{item.outletName}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex justify-between items-end mt-2">
                        {isService ? (
                            <Badge variant="outline">Layanan</Badge>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                                    <Minus className="h-3.5 w-3.5" />
                                </Button>
                                <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={!!(item.maxQuantity && item.quantity >= item.maxQuantity)}>
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}
                        <div className="text-right">
                            <p className="font-bold text-base text-primary">
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
}

function OrderSummary({ totalPrice, totalItems, outletCount, hasUnscheduledServices }: OrderSummaryProps) {
    const router = useRouter();
    const { items } = useCart();

    const handleCheckout = () => {
        if (hasUnscheduledServices) return;

        // Prepare checkout data from cart items
        const checkoutData = CheckoutService.prepareCheckoutData(items);

        // Save to localStorage for checkout page
        CheckoutService.saveCheckoutDataToStorage(checkoutData);

        // Redirect to checkout page
        router.push('/checkout');
    };

    return (
        <div className="sticky space-y-2">
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-xl">Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-muted-foreground">
                        <span className="text-sm">Subtotal ({totalItems} item)</span>
                        <span className="text-sm font-medium">Rp{totalPrice.toLocaleString('id-ID')}</span>
                    </div>
                    {/* Placeholder for discounts, etc. */}
                    <div className="pt-4 border-t">
                        <div className="flex items-baseline justify-between">
                            <span className="font-semibold">Total Pembayaran</span>
                            <span className="font-bold text-xl text-primary">Rp{totalPrice.toLocaleString('id-ID')}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Dari {outletCount} outlet berbeda.
                        </p>
                    </div>

                    <Button
                        size="lg"
                        className="w-full text-base"
                        disabled={hasUnscheduledServices}
                        onClick={handleCheckout}
                    >
                        <CreditCard className="w-5 h-5 mr-2" />
                        {hasUnscheduledServices ? 'Lengkapi Jadwal Dahulu' : 'Lanjut ke Pembayaran'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

const CART_APP_BAR_CONFIG = {
    title: 'Keranjang',
    showBackButton: true,
};

export default function CartPage() {
    const { items, getTotalItems, getTotalPrice } = useCart();
    const router = useRouter();
    useAppBarConfig(CART_APP_BAR_CONFIG);

    // 1. Siapkan input untuk useQuery (ID slot yang unik dan sudah diurutkan)
    const uniqueSlotIds = useMemo(() => {
        const slotIds = items
            .filter(item => item.type === 'SERVICE' && item.selectedSlot)
            .map(item => item.selectedSlot!);
        return [...new Set(slotIds)].sort();
    }, [items]);

    // 2. Gunakan useQuery untuk fetch data slot secara deklaratif
    const { data: slotDetails, isLoading: isLoadingSlots, isError } = useQuery({
        queryKey: ['bookingSlots', uniqueSlotIds],

        queryFn: async () => {
            // Promise.all untuk menjalankan semua request API secara paralel
            const slots = await Promise.all(
                uniqueSlotIds.map(id => BookingSlot.getById(id))
            );

            // Mengubah array hasil fetch menjadi object/map agar mudah diakses
            return slots.reduce((acc, slot) => {
                if (slot) acc[slot.id] = slot;
                return acc;
            }, {} as Record<string, BookingSlotType>);
        },

        // `enabled` memastikan query ini hanya berjalan jika ada slotId untuk dicari.
        enabled: uniqueSlotIds.length > 0,
        placeholderData: {},
    });

    // React Query sudah menangani state loading, error, dan data.
    const { itemsByOutlet, hasUnscheduledServices, totalItems, totalPrice } = useMemo(() => {
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

        return {
            itemsByOutlet: grouped,
            hasUnscheduledServices: unscheduledExists || unavailableExists,
            totalItems: getTotalItems(),
            totalPrice: getTotalPrice(),
        };
    }, [items, getTotalItems, getTotalPrice]);

    if (items.length === 0) {
        return (
            <EmptyState
                title='Keranjang Anda Kosong'
                description='Sepertinya Anda belum menambahkan produk atau layanan apa pun.'
                icon={<ShoppingCart className="w-16 h-16" />}
                action={{ label: "Mulai Belanja", onClick: () => router.push("/") }}
            />
        );
    }

    return (
        <div className="py-2">
            {/* <NotificationCenter /> */}
            {isError && (
                <div className="mb-4 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                    Gagal memuat beberapa detail jadwal. Silakan coba muat ulang halaman.
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-4 items-start">
                <div className="lg:col-span-2 space-y-4">
                    {Object.entries(itemsByOutlet).map(([outletId, { outletName, items: outletItems }]) => (
                        <Card key={outletId} className="pt-0 py-0 overflow-hidden">
                            <CardHeader className="bg-muted/50 pt-3 px-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Link
                                        href={`/outlet/${outletId}`}
                                        className='flex items-center gap-2 hover:opacity-85'
                                    >
                                        <Store className="w-5 h-5 text-primary" />
                                        {outletName}
                                    </Link>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 divide-y">
                                {outletItems.map((item) => (
                                    <CartItemCard
                                        key={item.id}
                                        item={item}
                                        slotInfo={item.selectedSlot ? slotDetails?.[item.selectedSlot] : null}
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
                    />
                </div>
            </div>
        </div>
    );
}