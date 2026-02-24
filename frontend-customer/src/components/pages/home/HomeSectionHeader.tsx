"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import React from "react"

interface HomeSectionHeaderProps {
    title: string
    subtitle?: string
    actionLabel?: string
    href?: string
}

function HomeSectionHeader({ title, subtitle, actionLabel, href }: HomeSectionHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div>
                <h2 className="text-base font-bold text-foreground">{title}</h2>
                {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
            {href && actionLabel && (
                <Link
                    href={href}
                    className="flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors flex-shrink-0"
                >
                    {actionLabel}
                    <ChevronRight className="h-3.5 w-3.5" />
                </Link>
            )}
        </div>
    )
}

export default React.memo(HomeSectionHeader)
