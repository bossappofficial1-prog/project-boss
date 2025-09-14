import { useTranslations } from "@/hooks/useI18n";

export function PaymentFooter({ className }: { className?: string }) {
    const t = useTranslations("paymentComponents");

    return <div className={`text-center ${className}`}>
        <p className="text-sm text-gray-500">
            {t("footer.helpText")}
        </p>
    </div>
}