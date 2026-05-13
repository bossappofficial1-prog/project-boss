import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { PaymentData } from "@/types";
import { useTranslations } from "@/hooks/useI18n";

type PaymentOrderSummaryProps = {
    data: PaymentData
}

export function PaymentOrderSummary({ data }: PaymentOrderSummaryProps) {
    const t = useTranslations("paymentComponents");
    const translateWithFallback = (key: string, fallback: string) => {
        try {
            const value = t(key as any);
            return value || fallback;
        } catch {
            return fallback;
        }
    };

    return (
        <Card className="mb-6">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t("orderSummary.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Outlet Info */}
                <div className="pb-3 border-b">
                    <h3 className="font-medium text-foreground">{data.outlet.name}</h3>
                </div>

                {/* Items */}
                <div className="space-y-2">
                    {data.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                            <div className="flex-1">
                                <p className="font-medium text-muted-foreground">{item.name}</p>
                                <p className="text-muted-foreground">{item.quantity}x {formatCurrency(item.price)}</p>
                            </div>
                            <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                    ))}
                </div>

                {/* Fees */}
                <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("orderSummary.subtotal")}</span>
                        <span>{formatCurrency(data.subtotal)}</span>
                    </div>
                    {/* Hide transaction fee for manual payment methods */}
                    {typeof data.transactionFee === "number" &&
                        data.transactionFee > 0 &&
                        data.paymentMethod.type !== 'QRIS_OFFLINE' &&
                        data.paymentMethod.type !== 'OWNER_TRANSFER' && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{translateWithFallback("orderSummary.transactionFee", "Biaya Transaksi")}</span>
                                <span>{formatCurrency(data.transactionFee)}</span>
                            </div>
                        )}
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("orderSummary.applicationFee")}</span>
                        <span>{formatCurrency(data.applicationFee)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2">
                        <span>{t("orderSummary.total")}</span>
                        <span>{formatCurrency(data.total)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}