"use client"

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight, type LucideIcon } from 'lucide-react'

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
    const Icon = action.icon;
    return (
        <Link
            href={action.href}
            className="group flex items-start gap-3 rounded-md border border-border/60 bg-card p-4 shadow-sm transition hover:border-primary/50 hover:shadow-md"
        >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
            </span>
            <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-foreground">{labels.title}</p>
                <p className="text-xs leading-snug text-muted-foreground">{labels.description}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
        </Link>
    )
}

export default React.memo(QuickActionCard);
