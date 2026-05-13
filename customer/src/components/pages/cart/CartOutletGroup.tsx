import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CartItem } from "@/hooks/useCart";
import { useTranslations } from "@/hooks/useI18n";
import { BookingSlotType } from "@/types";
import { RefreshCw, Store } from "lucide-react";
import Link from "next/link";
import { memo, useCallback } from "react";
import { CartItemCard } from "./CartItemCard";

export const CartOutletGroup = memo(({
    outletId,
    outletSlug,
    outletName,
    items,
    isSelected,
    onSelectOutlet,
    onRevalidate,
    isValidating,
    slotDetails,
    isItemValid,
    getInvalidReason,
    onUpdateQuantity,
    onRemoveItem,
    onUpdateSlot
}: {
    outletId: string;
    outletSlug: string;
    outletName: string;
    items: CartItem[];
    isSelected: boolean;
    onSelectOutlet: (id: string) => void;
    onRevalidate: () => void;
    isValidating: boolean;
    slotDetails: Record<string, BookingSlotType>;
    isItemValid: (id: string) => boolean;
    getInvalidReason: (id: string) => string | null;
    onUpdateQuantity: (id: string, qty: number) => void;
    onRemoveItem: (id: string) => void;
    onUpdateSlot: (itemId: string, slotId: string) => void;
}) => {
    const t = useTranslations("cart");

    // Prevent event bubbling for the refresh button
    const handleRefresh = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onRevalidate();
    }, [onRevalidate]);

    return (
        <Card
            onClick={() => onSelectOutlet(outletId)}
            className={`pt-0 py-0 gap-0 overflow-hidden rounded-md cursor-pointer transition-all ${isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "hover:border-primary/50"}`}
        >
            <CardHeader className="bg-muted/50 pt-3 px-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Link
                        href={`/outlet/${outletSlug}`}
                        className='flex items-center gap-2 hover:opacity-85'
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Store className="w-5 h-5 text-primary" />
                        {outletName}
                    </Link>
                    <div className="flex items-center gap-2 ml-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isValidating}
                            className="text-xs h-6"
                        >
                            <RefreshCw className={`w-3 h-3 ${isValidating ? 'animate-spin' : ''}`} />
                        </Button>
                        {isSelected && (
                            <Badge variant="default">
                                {t("outlet.selected")}
                            </Badge>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-0 divide-y">
                {items.map((item) => (
                    <CartItemCard
                        key={item.id}
                        item={item}
                        slotInfo={item.selectedSlot ? slotDetails?.[item.selectedSlot] : null}
                        isValid={isItemValid(item.id)}
                        invalidReason={getInvalidReason(item.id)}
                        onUpdateQuantity={onUpdateQuantity}
                        onRemoveItem={onRemoveItem}
                        onUpdateSlot={onUpdateSlot}
                    />
                ))}
            </CardContent>
        </Card>
    );
});