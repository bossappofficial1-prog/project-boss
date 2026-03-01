"use client"

import React from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface QuickActionCardProps {
    action: {
        key: string;
        href: string;
        icon: LucideIcon;
    };
    labels: {
        title: string;
        description: string;
    };
}

function QuickActionCard({ action, labels }: QuickActionCardProps) {
    const Icon = action.icon
    const searchParams = useSearchParams()
    const locale = searchParams?.get('locale')
    const href = locale
        ? `${action.href}${action.href.includes('?') ? '&' : '?'}locale=${encodeURIComponent(locale)}`
        : action.href

    return (
        <Link
            href={href}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/40 p-3 transition-colors hover:bg-muted/70 active:scale-95"
        >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-4.5 w-4.5" />
            </span>
            <span className="text-xs text-center font-medium text-foreground">{labels.title}</span>
        </Link>
    )
}

export default React.memo(QuickActionCard)
