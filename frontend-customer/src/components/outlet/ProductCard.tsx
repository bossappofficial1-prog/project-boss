'use client'

import { useCart } from "@/hooks/useCart";
import { OutletDetails } from "@/types";
import { SelectedSchedule } from "@/types/booking-slots";
import { useState, useCallback, useMemo } from "react";
import { Card } from "../ui/card";
import { Clock, Minus, Package, Plus, ShoppingCart, Wrench } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ScheduleModal } from "./ScheduleModal";
import { useRouter } from "next/navigation";
import { useSnackbar } from "@/hooks/useSnackbar";
import { ImageColorThief } from "../shared/ImageColorThief";
import { Product } from "@/types/product";

export default function ProductCard({ product, outlet }: { product: Product; outlet: OutletDetails }) {
    const { addItem, getOutletItems } = useCart();
    const snackbar = useSnackbar()
    const router = useRouter();
    const [quantity, setQuantity] = useState(1);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    // Derived values from new Product structure
    const productData = useMemo(() => {
        if (product.type === "GOODS" && product.goods) {
            return {
                price: product.goods.sellingPrice,
                quantity: product.goods.currentStock,
                unit: product.goods.unit,
                serviceDurationMinutes: null,
            };
        } else if (product.type === "SERVICE" && product.service) {
            return {
                price: product.service.sellingPrice,
                quantity: null,
                unit: null,
                serviceDurationMinutes: product.service.durationMinutes,
            };
        }
        return {
            price: 0,
            quantity: null,
            unit: null,
            serviceDurationMinutes: null,
        };
    }, [product]);

    const isOutOfStock = product.type === "GOODS" && productData.quantity !== null && productData.quantity <= 0;
    const isLowStock = product.type === "GOODS" && productData.quantity !== null && productData.quantity <= 5 && productData.quantity > 0;
    const isInactive = product.status === "INACTIVE";

    const cartItems = getOutletItems(outlet.id);
    const cartItem = cartItems.find(item => item.productId === product.id);
    const inCartQuantity = cartItem?.quantity || 0;
    const maxQuantity = product.type === "GOODS" && productData.quantity !== null ? productData.quantity : 99;
    const outletNotOpen = !outlet.isOpen;

    const handleCardClick = useCallback(() => {
        router.push(`/outlet/${outlet.id}/product/${product.id}?from=outlet`);
    }, [router, outlet.id, product.id]);

    const handleAddToCart = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();

        if (isInactive) {
            snackbar.error('Produk tidak tersedia', 3000);
            return;
        }

        if (product.type === 'GOODS') {
            if (!isOutOfStock) {
                try {
                    addItem(outlet.id, outlet.name, product, quantity);
                    setQuantity(1);
                    snackbar.success(`${quantity} ${productData.unit || 'item'} ditambahkan ke keranjang`, 2000);
                } catch (error) {
                    snackbar.error(error instanceof Error ? error.message : 'Terjadi kesalahan saat menambahkan produk ke keranjang', 10000)
                }
            }
        } else if (product.type === 'SERVICE') {
            setIsScheduleModalOpen(true);
        }
    }, [addItem, outlet.id, outlet.name, product, quantity, isOutOfStock, isInactive, productData.unit, snackbar]);

    const handleQuantityChange = (delta: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setQuantity(prevQuantity => {
            const newQuantity = prevQuantity + delta;
            if (newQuantity >= 1 && newQuantity <= maxQuantity - inCartQuantity) {
                return newQuantity;
            }
            return prevQuantity;
        });
    };

    const handleScheduleSelect = useCallback((selectedSchedule: SelectedSchedule) => {
        try {
            const success = addItem(outlet.id, outlet.name, product, 1, selectedSchedule);
            if (success) {
                setIsScheduleModalOpen(false);
                snackbar.success('Layanan berhasil ditambahkan ke keranjang', 2000);
            } else {
                snackbar.error('Jadwal bentrok dengan layanan lain di keranjang', 5000);
                console.warn('Failed to add service to cart due to time conflict');
            }
        } catch (error) {
            snackbar.error(error instanceof Error ? error.message : 'Terjadi kesalahan saat menambahkan layanan ke keranjang', 10000)
        }
    }, [addItem, outlet.id, outlet.name, product, snackbar]);

    const isDisabled = isOutOfStock || isInactive || outletNotOpen;

    return (
        <>
            <Card
                className={`flex flex-row p-2.5 transition-all duration-300 w-full overflow-hidden relative gap-0 group border rounded-xl items-stretch ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-md hover:border-primary/20'
                    }`}
                onClick={isDisabled ? undefined : handleCardClick}
            >
                {/* Image Section */}
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 bg-muted overflow-hidden rounded-lg">
                    {product.image ? (
                        <ImageColorThief
                            src={product.image}
                            alt={product.name}
                            className={`w-full h-full object-cover transition-transform duration-300 ${!isDisabled && 'group-hover:scale-105'
                                } ${isDisabled ? "grayscale" : ""}`}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50">
                            {product.type === "GOODS" ? <Package className="w-10 h-10" /> : <Wrench className="w-10 h-10" />}
                        </div>
                    )}

                    {/* Status Overlays */}
                    {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Badge className="bg-red-500/90 text-white border-none text-xs">Habis</Badge>
                        </div>
                    )}

                    {isInactive && !isOutOfStock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Badge className="bg-gray-500/90 text-white border-none text-xs">Nonaktif</Badge>
                        </div>
                    )}

                    {/* Duration Badge for Services */}
                    {product.type === "SERVICE" && productData.serviceDurationMinutes && !isDisabled && (
                        <Badge className="absolute top-1.5 right-1.5 backdrop-blur-sm bg-blue-500/90 text-white border-none text-[10px] px-1.5 py-0.5 shadow-sm">
                            <Clock className="w-2.5 h-2.5 mr-1" />
                            {productData.serviceDurationMinutes}m
                        </Badge>
                    )}

                    {/* Low Stock Badge */}
                    {isLowStock && !isInactive && (
                        <Badge className="absolute top-1.5 left-1.5 backdrop-blur-sm bg-orange-500/90 text-white border-none text-[10px] px-1.5 py-0.5 shadow-sm">
                            Stok: {productData.quantity}
                        </Badge>
                    )}
                </div>

                {/* Content Section */}
                <div className="pl-3 sm:pl-4 flex flex-col flex-grow justify-between min-w-0">
                    <div className="flex-grow">
                        <h3 className={`font-bold text-sm sm:text-base leading-tight line-clamp-2 transition-colors ${!isDisabled && 'group-hover:text-primary'
                            }`}>
                            {product.name}
                        </h3>
                        {product.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {product.description}
                            </p>
                        )}
                    </div>

                    {/* Cart Indicator */}
                    {inCartQuantity > 0 && (
                        <div className="flex items-center gap-1 text-xs text-primary font-medium pt-1 mt-1 border-t">
                            <ShoppingCart className="w-3 h-3" />
                            <span>{inCartQuantity} {productData.unit || 'item'} di keranjang</span>
                        </div>
                    )}

                    {/* Price and Actions */}
                    <div className="flex justify-between items-end mt-2 gap-2">
                        <div className="flex flex-col">
                            <p className="font-bold text-base sm:text-lg text-primary">
                                Rp {productData.price.toLocaleString("id-ID")}
                            </p>
                            {product.type === "GOODS" && productData.unit && (
                                <span className="text-[10px] text-muted-foreground">
                                    per {productData.unit}
                                </span>
                            )}
                        </div>

                        {!isDisabled && (
                            <div className="flex items-center gap-1 sm:gap-2">
                                {product.type === "GOODS" ? (
                                    <>
                                        <div className="flex items-center border rounded-full overflow-hidden h-7 sm:h-8 bg-background">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-full w-7 sm:w-8 p-0 rounded-none hover:bg-primary/10"
                                                onClick={(e) => handleQuantityChange(-1, e)}
                                                disabled={quantity <= 1}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="text-xs sm:text-sm font-semibold w-7 sm:w-8 text-center">
                                                {quantity}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-full w-7 sm:w-8 p-0 rounded-none hover:bg-primary/10"
                                                onClick={(e) => handleQuantityChange(1, e)}
                                                disabled={quantity >= maxQuantity - inCartQuantity}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <Button
                                            size="icon"
                                            className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 shadow-sm"
                                            onClick={handleAddToCart}
                                            disabled={inCartQuantity >= maxQuantity}
                                        >
                                            <ShoppingCart className="w-3.5 h-3.5" />
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        size="sm"
                                        className="h-8 px-3 text-xs shadow-sm"
                                        onClick={handleAddToCart}
                                    >
                                        <Clock className="w-3 h-3 mr-1.5" />
                                        Jadwal
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            <ScheduleModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                onSelectSchedule={handleScheduleSelect}
                product={product}
                outletId={outlet.id}
            />
        </>
    );
}