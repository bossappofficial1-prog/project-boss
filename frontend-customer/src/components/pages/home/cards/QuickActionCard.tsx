"use client"

import React from 'react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { useLocalizedPath } from '@/hooks/useI18n'

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
    const withLocalizedPath = useLocalizedPath()
    const href = withLocalizedPath(action.href)

    return (
        <Link
            href={href}
            className="flex flex-col items-center gap-1 rounded-xl bg-muted/40 p-2.5 transition-colors hover:bg-muted/70 active:scale-95 sm:gap-1.5 sm:p-3"
        >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-4.5 w-4.5" />
            </span>
            <span className="text-center text-[11px] font-medium leading-tight text-foreground sm:text-xs">{labels.title}</span>
        </Link>
    )
}

export default React.memo(QuickActionCard)
