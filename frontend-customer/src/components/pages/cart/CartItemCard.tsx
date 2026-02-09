import { ScheduleModal } from "@/components/outlet/ScheduleModal";
import { formatSelectedSlot } from "./helper";
import { memo, useCallback, useMemo, useState } from "react";
import { CartItem } from "@/hooks/useCart";
import { BookingSlot, BookingSlotType } from "@/types";
import { useTranslations } from "@/hooks/useI18n";
import { AlertCircle, Calendar, Minus, Plus, Timer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const CartItemCard = memo(({
    item,
    slotInfo,
    isValid = true,
    invalidReason,
    onUpdateQuantity,
    onRemoveItem,
    onUpdateSlot
}: {
    item: CartItem;
    slotInfo?: BookingSlotType | null;
    isValid?: boolean;
    invalidReason?: string | null;
    onUpdateQuantity: (id: string, qty: number) => void;
    onRemoveItem: (id: string) => void;
    onUpdateSlot: (itemId: string, slotId: string) => void;
}) => {
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const isService = item.type === "SERVICE";
    const t = useTranslations("cart");

    const handleScheduleSelect = useCallback((schedule: string | BookingSlot) => {
        const slotId = typeof schedule === 'string' ? schedule : (schedule as any).id;
        if (!slotId) return;
        onUpdateSlot(item.id, slotId);
        setShowScheduleModal(false);
    }, [item.id, onUpdateSlot]);

    // Memoize formatted date to avoid recalculation on every render
    const formattedSlot = useMemo(() => {
        if (!slotInfo) return null;
        return formatSelectedSlot(slotInfo.date, slotInfo.startTime, slotInfo.endTime);
    }, [slotInfo]);

    const ScheduleInfo = () => {
        if (!isService) return null;

        if (slotInfo && formattedSlot) {
            const isAvailable = slotInfo.status === "AVAILABLE";
            return (
                <div className="mt-2 space-y-2">
                    <div className="flex items-start justify-between gap-2 p-2 rounded-md bg-secondary/50 border">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary shrink-0" />
                            <div>
                                <p className="text-xs font-semibold">{formattedSlot.date}</p>
                                <p className="text-xs text-muted-foreground">{formattedSlot.time}</p>
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
                        className={`w-16 h-16 rounded-md object-cover bg-muted flex-shrink-0 ${!isValid ? 'opacity-50' : ''}`}
                    />
                    {!isValid && (
                        <div className="absolute inset-0 bg-black/20 rounded-md flex items-center justify-center">
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
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => onRemoveItem(item.id)}>
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
                                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1 || !isValid}
                                >
                                    <Minus className="h-3.5 w-3.5" />
                                </Button>
                                <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
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
});