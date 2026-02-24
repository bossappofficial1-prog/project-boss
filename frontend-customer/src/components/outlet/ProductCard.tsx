"use client";

import { useCart } from "@/hooks/useCart";
import { OutletDetails } from "@/types";
import { SelectedSchedule } from "@/types/booking-slots";
import { useState, useCallback, useMemo } from "react";
import { Card } from "../ui/card";
import { Clock, Minus, Package, Plus, ShoppingCart, Wrench, Ticket, MapPin, Calendar } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ScheduleModal } from "./ScheduleModal";
import { useRouter } from "next/navigation";
import { useSnackbar } from "@/hooks/useSnackbar";
import { ImageColorThief } from "../shared/ImageColorThief";
import { Product } from "@/types/product";

export default function ProductCard({
  product,
  outlet,
}: {
  product: Product;
  outlet: OutletDetails;
}) {
  const { addItem, getOutletItems } = useCart();
  const snackbar = useSnackbar();
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
        ticketAvailable: null,
        ticketMaxPerOrder: null,
      };
    } else if (product.type === "SERVICE" && product.service) {
      return {
        price: product.service.sellingPrice,
        quantity: null,
        unit: null,
        serviceDurationMinutes: product.service.durationMinutes,
        ticketAvailable: null,
        ticketMaxPerOrder: null,
      };
    } else if (product.type === "TICKET" && product.ticket) {
      const available = product.ticket.totalQuota - product.ticket.soldCount;
      return {
        price: product.ticket.sellingPrice,
        quantity: available,
        unit: "tiket",
        serviceDurationMinutes: null,
        ticketAvailable: available,
        ticketMaxPerOrder: product.ticket.maxPerOrder,
      };
    }
    return {
      price: 0,
      quantity: null,
      unit: null,
      serviceDurationMinutes: null,
      ticketAvailable: null,
      ticketMaxPerOrder: null,
    };
  }, [product]);

  const isOutOfStock =
    (product.type === "GOODS" && productData.quantity !== null && productData.quantity <= 0) ||
    (product.type === "TICKET" && productData.ticketAvailable !== null && productData.ticketAvailable <= 0);
  const isLowStock =
    product.type === "GOODS" &&
    productData.quantity !== null &&
    productData.quantity <= 5 &&
    productData.quantity > 0;
  const isEventPassed =
    product.type === "TICKET" && product.ticket && new Date(product.ticket.eventDate) < new Date();
  const isInactive = product.status === "INACTIVE";

  const cartItems = getOutletItems(outlet.id);
  const cartItem = cartItems.find((item) => item.productId === product.id);
  const inCartQuantity = cartItem?.quantity || 0;
  const maxQuantity =
    product.type === "GOODS" && productData.quantity !== null
      ? productData.quantity
      : product.type === "TICKET" && productData.ticketMaxPerOrder !== null
        ? Math.min(productData.ticketMaxPerOrder, productData.ticketAvailable ?? 99)
        : 99;
  const outletNotOpen = !outlet.isOpen;

  const handleCardClick = useCallback(() => {
    router.push(`/outlet/${outlet.id}/product/${product.id}?from=outlet`);
  }, [router, outlet.id, product.id]);

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (isInactive) {
        snackbar.error("Produk tidak tersedia", 3000);
        return;
      }

      if (product.type === "GOODS" || product.type === "TICKET") {
        if (!isOutOfStock && !isEventPassed) {
          try {
            addItem(outlet.id, outlet.name, product, quantity);
            setQuantity(1);
            snackbar.success(
              `${quantity} ${productData.unit || "item"} ditambahkan ke keranjang`,
              2000,
            );
          } catch (error) {
            snackbar.error(
              error instanceof Error
                ? error.message
                : "Terjadi kesalahan saat menambahkan produk ke keranjang",
              10000,
            );
          }
        }
      } else if (product.type === "SERVICE") {
        setIsScheduleModalOpen(true);
      }
    },
    [
      addItem,
      outlet.id,
      outlet.name,
      product,
      quantity,
      isOutOfStock,
      isInactive,
      productData.unit,
      snackbar,
    ],
  );

  const handleQuantityChange = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity((prevQuantity) => {
      const newQuantity = prevQuantity + delta;
      if (newQuantity >= 1 && newQuantity <= maxQuantity - inCartQuantity) {
        return newQuantity;
      }
      return prevQuantity;
    });
  };

  const handleScheduleSelect = useCallback(
    (selectedSchedule: SelectedSchedule) => {
      try {
        const success = addItem(outlet.id, outlet.name, product, 1, selectedSchedule);
        if (success) {
          setIsScheduleModalOpen(false);
          snackbar.success("Layanan berhasil ditambahkan ke keranjang", 2000);
        } else {
          snackbar.error("Jadwal bentrok dengan layanan lain di keranjang", 5000);
          console.warn("Failed to add service to cart due to time conflict");
        }
      } catch (error) {
        snackbar.error(
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat menambahkan layanan ke keranjang",
          10000,
        );
      }
    },
    [addItem, outlet.id, outlet.name, product, snackbar],
  );

  const isDisabled = isOutOfStock || isInactive || outletNotOpen || !!isEventPassed;

  return (
    <>
      <Card
        className={`flex flex-row p-3 transition-all duration-200 w-full overflow-hidden relative gap-0 group border border-border/60 rounded-xl items-stretch ${isDisabled
          ? "opacity-50 cursor-not-allowed bg-muted/30"
          : "cursor-pointer hover:shadow-md hover:border-primary/20 active:scale-[0.99]"
          }`}
        onClick={isDisabled ? undefined : handleCardClick}>
        {/* Image Section */}
        <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          {product.image ? (
            <ImageColorThief
              src={product.image}
              alt={product.name}
              className={`w-full h-full object-cover transition-transform duration-300 ${!isDisabled && "group-hover:scale-105"
                } ${isDisabled ? "grayscale" : ""}`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/60 text-muted-foreground/40">
              {product.type === "GOODS" ? (
                <Package className="w-8 h-8" />
              ) : product.type === "TICKET" ? (
                <Ticket className="w-8 h-8" />
              ) : (
                <Wrench className="w-8 h-8" />
              )}
            </div>
          )}

          {/* Status Overlays */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">Habis</span>
            </div>
          )}

          {isInactive && !isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-[10px] font-bold text-white bg-gray-500 px-2 py-0.5 rounded-full">Nonaktif</span>
            </div>
          )}

          {isEventPassed && !isOutOfStock && !isInactive && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-[10px] font-bold text-white bg-gray-500 px-2 py-0.5 rounded-full">Event Selesai</span>
            </div>
          )}

          {/* Duration Badge for Services */}
          {product.type === "SERVICE" && productData.serviceDurationMinutes && !isDisabled && (
            <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-blue-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full shadow-sm">
              <Clock className="w-2.5 h-2.5" />
              {productData.serviceDurationMinutes}m
            </span>
          )}

          {/* Event Badge for Tickets */}
          {product.type === "TICKET" && product.ticket && !isDisabled && (
            <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-emerald-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full shadow-sm">
              <Calendar className="w-2.5 h-2.5" />
              {new Date(product.ticket.eventDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
            </span>
          )}

          {/* Low Stock Badge */}
          {isLowStock && !isInactive && (
            <span className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full shadow-sm">
              Stok: {productData.quantity}
            </span>
          )}

          {/* Ticket Remaining Badge */}
          {product.type === "TICKET" && productData.ticketAvailable !== null && productData.ticketAvailable > 0 && productData.ticketAvailable <= 10 && !isDisabled && (
            <span className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full shadow-sm">
              Sisa: {productData.ticketAvailable}
            </span>
          )}
        </div>

        {/* Content Section */}
        <div className="pl-3 sm:pl-4 flex flex-col flex-grow justify-between min-w-0">
          <div className="flex-grow">
            <h3
              className={`font-semibold text-sm leading-snug line-clamp-2 transition-colors ${!isDisabled && "group-hover:text-primary"
                }`}>
              {product.name}
            </h3>
            {product.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Cart Indicator */}
          {inCartQuantity > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-primary font-medium mt-1.5 bg-primary/5 rounded-md px-2 py-1 w-fit">
              <ShoppingCart className="w-3 h-3" />
              <span>
                {inCartQuantity} {productData.unit || "item"} di keranjang
              </span>
            </div>
          )}

          {/* Price and Actions */}
          <div className="flex justify-between items-end mt-2 gap-2">
            <div>
              <p className="font-bold text-base text-primary tabular-nums">
                Rp {productData.price.toLocaleString("id-ID")}
              </p>
              {product.type === "GOODS" && productData.unit && (
                <span className="text-[10px] text-muted-foreground leading-none">per {productData.unit}</span>
              )}
              {product.type === "TICKET" && product.ticket?.venue && (
                <span className="text-[10px] text-muted-foreground leading-none flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  {product.ticket.venue}
                </span>
              )}
            </div>

            {!isDisabled && (
              <div className="flex items-center gap-1.5">
                {product.type === "GOODS" || product.type === "TICKET" ? (
                  <>
                    <div className="flex items-center border border-border/80 rounded-full overflow-hidden h-7 bg-background shadow-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-full w-7 p-0 rounded-none hover:bg-muted"
                        onClick={(e) => handleQuantityChange(-1, e)}
                        disabled={quantity <= 1}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs font-semibold w-7 text-center tabular-nums">
                        {quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-full w-7 p-0 rounded-none hover:bg-muted"
                        onClick={(e) => handleQuantityChange(1, e)}
                        disabled={quantity >= maxQuantity - inCartQuantity}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      size="icon"
                      className="h-7 w-7 rounded-full flex-shrink-0 shadow-sm"
                      onClick={handleAddToCart}
                      disabled={inCartQuantity >= maxQuantity}>
                      <ShoppingCart className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs rounded-full shadow-sm gap-1"
                    onClick={handleAddToCart}>
                    <Clock className="w-3 h-3" />
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
        isOutletOpen={outlet.isOpen}
      />
    </>
  );
}
