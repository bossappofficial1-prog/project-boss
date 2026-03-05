"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Minus, X, Package, Wrench, Clock, Calendar, MapPin, AlertCircle } from 'lucide-react';
import { useCart, CartItem } from '@/hooks/useCart';
import { ImageRender } from '@/components/shared/Image';
import { usePathname, useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { BookingSlotType } from '@/types';
import { BookingSlot } from '@/services/booking-slot';
import FloatingButton from '../shared/FloatingButton';
import { ROUTES_CART_DISABLED } from '@/constants';
import { useLocalizedPath, useTranslations } from "@/hooks/useI18n";
import { isRouteDisabled } from '@/lib/utils';

interface CartItemComponentProps {
    item: CartItem;
}

function CartItemComponent({ item }: CartItemComponentProps) {
    const { updateQuantity, removeItem } = useCart();
    const [slotInfo, setSlotInfo] = useState<BookingSlotType | null>(null)
    const isService = item.type === "SERVICE";
    const t = useTranslations("cart");
    console.log(isService);

    useEffect(() => {
        console.log(isService);

        if (!isService && !item.selectedSlot) return;

        (async () => {
            const slot = await BookingSlot.getById(item.selectedSlot!)
            setSlotInfo(slot)

            console.log(slot);
        })()
    }, [isService, item])

    return (
        <div className="flex gap-3 p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
            {/* Item Image */}
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 border">
                {item.image ? (
                    <ImageRender
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/80">
                        {item.type === 'GOODS' ? (
                            <Package className="w-8 h-8 text-muted-foreground" />
                        ) : (
                            <Wrench className="w-8 h-8 text-muted-foreground" />
                        )}
                    </div>
                )}
            </div>

            {/* Item Details */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                            {item.type && (
                                <Badge
                                    variant={item.type === 'GOODS' ? 'secondary' : 'default'}
                                    className="text-xs px-2 py-0.5"
                                >
                                    {item.type === 'GOODS' ? t("product") : t("service")}
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-1 mb-2">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground line-clamp-1">{item.outletName}</p>
                        </div>

                        {/* Service-specific information */}
                        {item.type === 'SERVICE' && (
                            <div className="space-y-1.5">
                                {item.serviceDurationMinutes && (
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3 h-3 text-blue-500" />
                                        <span className="text-xs text-blue-700 font-medium">
                                            {t("itemDetails.duration")}: {item.serviceDurationMinutes} {t("minutes")}
                                        </span>
                                    </div>
                                )}
                                {item.selectedSlot && (
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3 text-green-500" />
                                        <span className="text-xs text-green-700 font-medium">
                                            {item.selectedSlot}
                                        </span>
                                    </div>
                                )}
                                {!item.selectedSlot && (
                                    <div className="flex items-center gap-1.5">
                                        <AlertCircle className="w-3 h-3 text-orange-500" />
                                        <span className="text-xs text-orange-600 font-medium">
                                            {t("itemDetails.scheduleNotSelected")}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Stock info for GOODS */}
                        {item.type === 'GOODS' && item.maxQuantity && (
                            <div className="flex items-center gap-1.5 mt-1">
                                <Package className="w-3 h-3 text-gray-500" />
                                <span className="text-xs text-gray-600">
                                    {t("itemDetails.stockRemaining", { count: item.maxQuantity - item.quantity + 1 })}
                                </span>
                            </div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        onClick={() => removeItem(item.id)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Quantity Controls & Price */}
                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                        {item.type === 'GOODS' ? (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-sm font-medium w-8 text-center bg-muted px-2 py-1 rounded">
                                    {item.quantity}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    disabled={!!(item.maxQuantity && item.quantity >= item.maxQuantity)}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                                {item.unit && (
                                    <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                    {t("itemDetails.serviceQuantity")}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-base text-primary">
                            Rp{(item.price * item.quantity).toLocaleString('id-ID')}
                        </p>
                        {item.quantity > 1 && (
                            <p className="text-xs text-muted-foreground">
                                Rp{item.price.toLocaleString('id-ID')} {t("itemDetails.perItem")}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface CartDrawerProps {
    children: React.ReactNode;
}

export function CartDrawer({ children }: CartDrawerProps) {
    const { items, isOpen, setIsOpen, getTotalItems, getTotalPrice, clearCart } = useCart();
    const t = useTranslations("cart");

    const totalItems = getTotalItems();
    const totalPrice = getTotalPrice();

    // Group items by outlet
    const itemsByOutlet = items.reduce((acc, item) => {
        if (!acc[item.outletId]) {
            acc[item.outletId] = {
                outletName: item.outletName,
                items: []
            };
        }
        acc[item.outletId].items.push(item);
        return acc;
    }, {} as Record<string, { outletName: string; items: CartItem[] }>);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        {t("drawer.title", { count: totalItems })}
                    </DialogTitle>
                    <DialogDescription>
                        {t("drawer.description")}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col h-full min-h-0">
                    {items.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                            <ShoppingCart className="w-12 h-12 text-muted-foreground mb-4" />
                            <h3 className="font-medium text-lg mb-2">{t("drawer.empty.title")}</h3>
                            <p className="text-muted-foreground text-sm">
                                {t("drawer.empty.description")}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto min-h-0">
                                <div className="space-y-4">
                                    {Object.entries(itemsByOutlet).map(([outletId, { outletName, items: outletItems }]) => {
                                        const goodsItems = outletItems.filter(item => item.type === 'GOODS');
                                        const serviceItems = outletItems.filter(item => item.type === 'SERVICE');
                                        const outletTotal = outletItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                                        return (
                                            <Card key={outletId} className="border-l-4 border-l-primary">
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="text-base">{outletName}</CardTitle>
                                                        {outletTotal && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Rp{outletTotal.toLocaleString('id-ID')}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-4 text-xs text-muted-foreground">
                                                        {goodsItems.length > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Package className="w-3 h-3" />
                                                                {goodsItems.length} {t("drawer.products")}
                                                            </span>
                                                        )}
                                                        {serviceItems.length > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Wrench className="w-3 h-3" />
                                                                {serviceItems.length} {t("drawer.services")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-0">
                                                    {outletItems.map((item) => (
                                                        <CartItemComponent key={item.id} item={item} />
                                                    ))}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Cart Summary */}
                            <div className="border-t border-border pt-6 mt-4 space-y-4">
                                {/* Items breakdown */}
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">{t("summary")}</h4>
                                    <div className="space-y-1.5">
                                        {Object.entries(itemsByOutlet).map(([outletId, { outletName, items: outletItems }]) => {
                                            const outletTotal = outletItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                                            const goodsCount = outletItems.filter(item => item.type === 'GOODS').length;
                                            const servicesCount = outletItems.filter(item => item.type === 'SERVICE').length;

                                            return (
                                                <div key={outletId} className="flex justify-between items-center text-sm">
                                                    <div>
                                                        <span className="font-medium">{outletName}</span>
                                                        <div className="text-xs text-muted-foreground">
                                                            {goodsCount > 0 && `${goodsCount} ${t("drawer.products")}`}
                                                            {goodsCount > 0 && servicesCount > 0 && ', '}
                                                            {servicesCount > 0 && `${servicesCount} ${t("drawer.services")}`}
                                                        </div>
                                                    </div>
                                                    <span className="font-medium">
                                                        Rp{outletTotal.toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Service reminders */}
                                {items.some(item => item.type === 'SERVICE' && !item.selectedSlot) && (
                                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-orange-700">
                                                    {t("drawer.scheduleReminder.title")}
                                                </p>
                                                <p className="text-xs text-orange-600">
                                                    {t("drawer.scheduleReminder.description")}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Total */}
                                <div className="bg-primary/5 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-semibold text-lg">{t("total")}</span>
                                            <p className="text-sm text-muted-foreground">
                                                {totalItems} item{totalItems > 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <span className="font-bold text-2xl text-primary">
                                            Rp{totalPrice.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={clearCart}
                                        disabled={items.length === 0}
                                        className="flex-1"
                                    >
                                        {t("buttons.deleteAll")}
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        disabled={items.length === 0 || items.some(item => item.type === 'SERVICE' && !item.selectedSlot)}
                                        onClick={() => {
                                            // TODO: Implement checkout
                                            console.log('Checkout:', items);
                                        }}
                                    >
                                        {t("buttons.checkout")}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function FloatingCartButton({ className = '' }: { className?: string }) {
    const pathname = usePathname()
    const { getTotalItems } = useCart();
    const router = useRouter();
    const totalItems = getTotalItems();
    const [mounted, setMounted] = useState(false);
    const withLocalizedPath = useLocalizedPath();
    const localizedDisabledRoutes = useMemo(
        () => ROUTES_CART_DISABLED.map((route) => withLocalizedPath(route)),
        [withLocalizedPath],
    );

    useEffect(() => {
        setMounted(true);
    }, []);

    const isOutletPage = pathname.startsWith(withLocalizedPath('/outlet/'));

    if (!mounted || totalItems === 0 || !isOutletPage || isRouteDisabled(pathname, localizedDisabledRoutes)) return null;

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        router.push('/cart');
    }

    return (
        <FloatingButton
        >
            <Button
                size="sm"
                className={"rounded-full bg-blue-500 hover:bg-blue-600 h-12 w-12 scale-90 shadow-lg hover:shadow-xl transition-shadow" + className}
                onClick={handleClick}
            >
                <div className="relative">
                    <ShoppingCart className="w-5 h-5" />
                    {totalItems > 0 && (
                        <Badge className="absolute -top-3 -right-2 h-4 w-4 flex items-center justify-center p-1">
                            {totalItems > 99 ? '99+' : totalItems}
                        </Badge>
                    )}
                </div>
            </Button>
        </FloatingButton>
    );
}
