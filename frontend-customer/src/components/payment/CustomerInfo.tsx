import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useTranslations } from "@/hooks/useI18n";

type CustomerInfoProps = {
    name: string,
    phone: string
}

export function CustomerInfo({ name, phone }: CustomerInfoProps) {
    const t = useTranslations("paymentComponents");

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">{t("customerInfo.title")}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("customerInfo.name")}</span>
                        <span className="font-medium">{name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("customerInfo.phone")}</span>
                        <span className="font-medium">{phone}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}