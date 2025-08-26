'use client'

import { useCart } from "@/hooks/useCart";
import { OutletDetails, Product, ProductType } from "@/types";
import { useState, useCallback } from "react";
import { Card } from "../ui/card";
import { ImageRender } from "../shared/Image";
import { Clock, Minus, Package, Plus, ShoppingCart, Wrench } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ScheduleModal } from "./ScheduleModal";
import { useRouter } from "next/navigation";

export default function ProductCard({ product, outlet }: { product: ProductType; outlet: OutletDetails }) {
    const { addItem, getOutletItems } = useCart();
    const router = useRouter();
    const [quantity, setQuantity] = useState(1);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    const isOutOfStock = product.type === "GOODS" && product.quantity !== null && product.quantity <= 0;
    const isLowStock = product.type === "GOODS" && product.quantity !== null && product.quantity <= 5 && product.quantity > 0;

    const cartItems = getOutletItems(outlet.id);
    const cartItem = cartItems.find(item => item.productId === product.id);
    const inCartQuantity = cartItem?.quantity || 0;
    const maxQuantity = product.type === "GOODS" && product.quantity !== null ? product.quantity : 99;

    const handleCardClick = useCallback(() => {
        router.push(`/outlet/${outlet.id}/product/${product.id}`);
    }, [router, outlet.id, product.id]);

    const handleAddToCart = useCallback((e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        if (product.type === 'GOODS') {
            if (!isOutOfStock) {
                addItem(outlet.id, outlet.name, product, quantity);
                setQuantity(1);
            }
        } else if (product.type === 'SERVICE') {
            setIsScheduleModalOpen(true);
        }
    }, [addItem, outlet.id, outlet.name, product, quantity, isOutOfStock]);

    const handleQuantityChange = (delta: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        setQuantity(prevQuantity => {
            const newQuantity = prevQuantity + delta;
            if (newQuantity >= 1 && newQuantity <= maxQuantity - inCartQuantity) {
                return newQuantity;
            }
            return prevQuantity;
        });
    };

    const handleScheduleSelect = useCallback((selectedSchedule: string) => {
        addItem(outlet.id, outlet.name, product, 1, selectedSchedule);
        setIsScheduleModalOpen(false);
    }, [addItem, outlet.id, outlet.name, product]);

    return (
        <>
            <Card
                className="flex flex-row p-2.5 transition-all duration-300 hover:shadow-md w-full overflow-hidden relative gap-0 group border rounded-xl items-stretch cursor-pointer"
                onClick={handleCardClick}
            >
                {/* Image Section - flex-shrink-0 prevents image from shrinking */}
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 bg-muted overflow-hidden rounded-lg">
                    {product.image ? (
                        <ImageRender
                            src={product.image}
                            alt={product.name}
                            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${isOutOfStock ? "grayscale" : ""}`}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50">
                            {product.type === "GOODS" ? <Package className="w-10 h-10" /> : <Wrench className="w-10 h-10" />}
                        </div>
                    )}

                    {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Badge className="bg-red-500/90 text-white border-none">Habis</Badge>
                        </div>
                    )}

                    {product.type === "SERVICE" && product.serviceDurationMinutes && (
                        <Badge className="absolute top-1.5 right-1.5 backdrop-blur-sm bg-blue-500/80 text-white border-none text-[10px] px-1.5 py-0.5">
                            <Clock className="w-2.5 h-2.5 mr-1" />
                            {product.serviceDurationMinutes}m
                        </Badge>
                    )}
                    {isLowStock && (
                        <Badge className="absolute top-1.5 left-1.5 backdrop-blur-sm bg-orange-500/80 text-white border-none text-[10px] px-1.5 py-0.5">
                            Terbatas
                        </Badge>
                    )}
                </div>

                {/* Content Section - min-w-0 allows text to wrap properly */}
                <div className="pl-3 sm:pl-4 flex flex-col flex-grow justify-between min-w-0">
                    <div className="flex-grow">
                        <h3 className="font-bold text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {product.name}
                        </h3>
                        {product.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {product.description}
                            </p>
                        )}
                    </div>

                    {inCartQuantity > 0 && (
                        <div className="text-xs text-primary font-medium pt-1 mt-1 border-t">
                            {inCartQuantity} {product.unit || 'item'} di keranjang
                        </div>
                    )}

                    <div className="flex justify-between flex-col gap-2 items-end mt-1">
                        <p className="font-bold text-base sm:text-lg text-red-600">
                            Rp {product.price.toLocaleString("id-ID")}
                        </p>

                        {!isOutOfStock && (
                            <div className="flex items-center gap-1 sm:gap-2">
                                {product.type === "GOODS" ? (
                                    <>
                                        <div className="flex items-center border rounded-full overflow-hidden h-7 sm:h-8">
                                            <Button variant="ghost" size="sm" className="h-full w-7 sm:w-8 p-0 rounded-none" onClick={(e) => handleQuantityChange(-1, e)} disabled={quantity <= 1}>
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="text-xs sm:text-sm font-semibold w-7 sm:w-8 text-center">{quantity}</span>
                                            <Button variant="ghost" size="sm" className="h-full w-7 sm:w-8 p-0 rounded-none" onClick={(e) => handleQuantityChange(1, e)} disabled={quantity >= maxQuantity - inCartQuantity}>
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <Button size="icon" className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0" onClick={handleAddToCart} disabled={inCartQuantity >= maxQuantity}>
                                            <ShoppingCart className="w-3.5 h-3.5" />
                                        </Button>
                                    </>
                                ) : ( // For Services
                                    <Button size="sm" className="h-8 px-3 text-xs" onClick={handleAddToCart}>
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
            />
        </>
    );
}