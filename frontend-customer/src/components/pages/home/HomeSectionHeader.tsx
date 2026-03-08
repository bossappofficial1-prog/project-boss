"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import React from "react"
import { useLocalizedPath } from "@/hooks/useI18n"

interface HomeSectionHeaderProps {
    title: string
    subtitle?: string
    actionLabel?: string
    href?: string
}

function HomeSectionHeader({ title, subtitle, actionLabel, href }: HomeSectionHeaderProps) {
    const withLocalizedPath = useLocalizedPath()
    const targetHref = href ? withLocalizedPath(href) : href

    return (
        <div className="flex items-center justify-between gap-3">
            <div>
                <h2 className="text-sm font-bold text-foreground sm:text-base">{title}</h2>
                {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            {href && actionLabel && (
                <Link
                    href={targetHref ?? href}
                    className="flex flex-shrink-0 items-center gap-0.5 text-[11px] font-medium text-primary transition-colors hover:text-primary/80 sm:text-xs"
                >
                    {actionLabel}
                    <ChevronRight className="h-3.5 w-3.5" />
                </Link>
            )}
        </div>
    )
}

export default React.memo(HomeSectionHeader)
