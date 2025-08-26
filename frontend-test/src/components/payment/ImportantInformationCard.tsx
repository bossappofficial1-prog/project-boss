'use client'

import { IMPORTANT_INFORMATION_PAYMENT, ImportantInformationPaymentType, ImportantInformationType } from "@/constants"
import { useTranslations } from "@/hooks/useI18n";
import { useSearchParams } from "next/navigation"

interface ImportantInformationCardProps {
    type: ImportantInformationType
}

export function ImportantInformationCard({ type }: ImportantInformationCardProps) {
    const locale = useSearchParams().get("locale") as "id" | "en";
    const t = useTranslations("text")
    const informationToShow = IMPORTANT_INFORMATION_PAYMENT[type][locale] || []

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">{t("txtImportantInformation")}</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                {informationToShow.map((info, index) => (
                    <li key={info.replace(" ", "").toLocaleLowerCase() + index}>{info}</li>
                ))}
            </ul>
        </div>
    )
}