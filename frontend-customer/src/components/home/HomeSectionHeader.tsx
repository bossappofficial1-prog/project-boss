"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { ReactNode } from "react"

interface HomeSectionHeaderProps {
    title: string
    subtitle?: string
    actionLabel?: string
    href?: string
    icon?: ReactNode
}

export function HomeSectionHeader({ title, subtitle, actionLabel, href, icon }: HomeSectionHeaderProps) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                    {icon && <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</span>}
                    <span>{title}</span>
                </div>
                {subtitle && <p className="text-xs text-muted-foreground max-w-md leading-relaxed">{subtitle}</p>}
            </div>
            {href && actionLabel && (
                <Link
                    href={href}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                    <span>{actionLabel}</span>
                    <ChevronRight className="h-4 w-4" />
                </Link>
            )}
        </div>
    )
}
