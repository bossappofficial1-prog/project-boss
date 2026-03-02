'use client'

import { IMPORTANT_INFORMATION_PAYMENT, ImportantInformationPaymentType, ImportantInformationType } from "@/constants"
import { useLocale, useTranslations } from "@/hooks/useI18n";

interface ImportantInformationCardProps {
    type: ImportantInformationType
}

export function ImportantInformationCard({ type }: ImportantInformationCardProps) {
    const locale = useLocale();
    const t = useTranslations("text")
    const informationToShow = IMPORTANT_INFORMATION_PAYMENT[type][locale] || []

    return (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">{t("txtImportantInformation")}</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                {informationToShow.map((info, index) => (
                    <li key={info.replace(" ", "").toLocaleLowerCase() + index}>{info}</li>
                ))}
            </ul>
        </div>
    )
}