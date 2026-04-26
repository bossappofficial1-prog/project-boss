import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CartItem, useCart } from "@/hooks/useCart";
import { useTranslations } from "@/hooks/useI18n";
import { useSnackbar } from "@/hooks/useSnackbar";
import { CheckoutService } from "@/services/checkout";
import { CreditCard, UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useCallback, useMemo } from "react";

export const OrderSummary = memo(({
    totalPrice,
    totalItems,
    outletCount,
    hasUnscheduledServices,
    selectedOutletId,
    onSelectOutlet,
    selectedOutletTotal,
    selectedOutletItems,
    selectedOutletName,
    selectedOutletItemsList
}: {
    totalPrice: number;
    totalItems: number;
    outletCount: number;
    hasUnscheduledServices: boolean;
    selectedOutletId: string | null;
    onSelectOutlet: (outletId: string | null) => void;
    selectedOutletTotal: number;
    selectedOutletItems: number;
    selectedOutletName?: string;
    selectedOutletItemsList: CartItem[];
}) => {
    const router = useRouter();
    const t = useTranslations("cart");
    const snackbar = useSnackbar();
    const { tableName, tableId, tableOutletId } = useCart();

    const handleCheckout = useCallback(async () => {
        if (hasUnscheduledServices) return;

        if (!selectedOutletId) {
            snackbar.success(t("validation.selectOutlet"));
            return;
        }

        try {
            localStorage.setItem('selectedOutletIdCheckoutItem', JSON.stringify(selectedOutletItemsList));
            const checkoutData = await CheckoutService.prepareCheckoutData(selectedOutletItemsList);
            CheckoutService.saveCheckoutDataToStorage(checkoutData);
            router.push('/checkout');
        } catch (error) {
            alert(t("validation.checkoutError"));
        }
    }, [hasUnscheduledServices, selectedOutletId, selectedOutletItemsList, snackbar, t, router]);

    // Calculate mixed product types for the selected outlet
    const { hasMixedProducts, mixedTypesStr } = useMemo(() => {
        if (!selectedOutletId || selectedOutletItemsList.length === 0) return { hasMixedProducts: false, mixedTypesStr: '' };

        const types = [...new Set(selectedOutletItemsList.map(item => item.type))];
        return {
            hasMixedProducts: types.length > 1,
            mixedTypesStr: types.join(' dan ')
        };
    }, [selectedOutletId, selectedOutletItemsList]);

    return (
        <div className="sticky space-y-2">
            <Card className="shadow-md rounded-md">
                <CardHeader>
                    <CardTitle className="text-xl">{t("summary")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between items-center text-muted-foreground">
                        <span className="text-sm">{t("subtotal")} ({selectedOutletId ? selectedOutletItems : totalItems} {t("items")}{selectedOutletId && selectedOutletItems !== 1 ? 's' : ''})</span>
                        <span className="text-sm font-medium">Rp{(selectedOutletId ? selectedOutletTotal : totalPrice).toLocaleString('id-ID')}</span>
                    </div>

                    <div className="pt-4 border-t">
                        <div className="flex items-baseline justify-between">
                            <span className="font-semibold">{t("orderSummary.totalPayment")}</span>
                            <span className="font-bold text-xl text-primary">Rp{(selectedOutletId ? selectedOutletTotal : totalPrice).toLocaleString('id-ID')}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {selectedOutletId
                                ? t("orderSummary.fromOutlet", { outletName: selectedOutletName || "" })
                                : t("orderSummary.fromOutlets", { count: outletCount })
                            }
                        </p>
                    </div>
                    
                    {/* Only show table indicator if it belongs to the selected outlet */}
                    {(tableName || tableId) && tableOutletId === selectedOutletId && (
                        <div className="bg-primary/5 border border-primary/20 rounded-md p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="bg-primary/10 p-1.5 rounded-lg">
                                    <UtensilsCrossed className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wider leading-none mb-1">Pesan untuk Meja</p>
                                    <p className="text-sm font-black text-primary">{tableName || tableId?.slice(0, 8)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-full">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                                </span>
                                <span className="text-[9px] font-black uppercase text-primary tracking-tighter">Aktif</span>
                            </div>
                        </div>
                    )}

                    {selectedOutletId ? (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-green-800">{t("outlet.selectedOutlet")}</p>
                                    <p className="text-xs text-green-600 mt-1">{selectedOutletName}</p>
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
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                            <p className="text-sm font-medium text-yellow-800">{t("outlet.chooseOutlet")}</p>
                            <p className="text-xs text-yellow-600 mt-1">
                                {t("outlet.chooseOutletDescription")}
                            </p>
                        </div>
                    )}

                    {hasMixedProducts && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm font-medium text-red-800">{t("validation.attention")}</p>
                            <p className="text-xs text-red-600 mt-1">
                                {t("validation.mixedProducts", {
                                    outletName: selectedOutletName || "",
                                    types: mixedTypesStr
                                })}
                            </p>
                        </div>
                    )}

                    <Button
                        size="lg"
                        className="w-full text-base"
                        data-guide-target="cart-proceed-checkout"
                        disabled={hasUnscheduledServices || !selectedOutletId || hasMixedProducts}
                        onClick={handleCheckout}
                    >
                        <CreditCard className="w-5 h-5 mr-2" />
                        {hasUnscheduledServices ? t("buttons.completeScheduleFirst") :
                            !selectedOutletId ? t("buttons.selectOutletFirst") :
                                hasMixedProducts ? t("buttons.selectProductType") : t("buttons.proceedToPayment")
                        }
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
});