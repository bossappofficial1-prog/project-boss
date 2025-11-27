"use client"

import { OrderStatus } from "@/types"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Clock, Hourglass, CheckCircle, PackageCheck, XCircle, ListOrdered, Play } from "lucide-react"
import { useTranslations } from "@/hooks/useI18n"

type StatusType = typeof OrderStatus[keyof typeof OrderStatus] | 'ALL'

interface StatusTabsProps {
    activeTab: StatusType
    onTabChange: (tab: StatusType) => void
    counts: Record<StatusType, number>
}

export default function StatusTabs({ activeTab, onTabChange, counts }: StatusTabsProps) {
    const t = useTranslations('orders')

    const statusConfig = {
        ALL: {
            label: t('tabs.all'),
            icon: ListOrdered,
            color: "default" as const,
        },
        AWAITING_PAYMENT: {
            label: t('tabs.awaiting_payment'),
            icon: Hourglass,
            color: "secondary" as const,
        },
        PROCESSING: {
            label: t('tabs.processing'),
            icon: Clock,
            color: "default" as const,
        },
        CONFIRMED: {
            label: t('tabs.confirmed'),
            icon: CheckCircle,
            color: "default" as const,
        },
        READY: {
            label: t('tabs.ready'),
            icon: PackageCheck,
            color: "default" as const,
        },
        ON_GOING: {
            label: t('tabs.on_going'),
            icon: Play,
            color: "default" as const,
        },
        COMPLETED: {
            label: t('tabs.completed'),
            icon: CheckCircle,
            color: "default" as const,
        },
        CANCELLED: {
            label: t('tabs.cancelled'),
            icon: XCircle,
            color: "destructive" as const,
        },
    }

    const tabs = Object.keys(statusConfig) as StatusType[]

    return (
        <div className="sticky top-0 z-10 bg-background border-b">
            <ScrollArea className="w-full">
                <div className="flex gap-2 p-4 pb-3">
                    {tabs.map((tab) => {
                        const config = statusConfig[tab]
                        const Icon = config.icon
                        const count = counts[tab] || 0
                        const isActive = activeTab === tab

                        return (
                            <button
                                key={tab}
                                onClick={() => onTabChange(tab)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-md whitespace-nowrap transition-all shrink-0",
                                    "border-2 font-medium text-sm",
                                    isActive
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{config.label}</span>
                                {count > 0 && (
                                    <Badge
                                        variant={isActive ? "secondary" : config.color}
                                        className={cn(
                                            "ml-1 px-1.5 py-0 h-5 text-xs font-bold",
                                            isActive && "bg-primary-foreground text-primary"
                                        )}
                                    >
                                        {count > 99 ? "99+" : count}
                                    </Badge>
                                )}
                            </button>
                        )
                    })}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
        </div>
    )
}
