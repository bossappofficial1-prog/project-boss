"use client";

import { OrderStatus } from "@/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useI18n";

type StatusType = (typeof OrderStatus)[keyof typeof OrderStatus] | "ALL";

interface StatusTabsProps {
    activeTab: StatusType;
    onTabChange: (tab: StatusType) => void;
    counts: Record<string, number>;
}

const ALL_TABS: StatusType[] = [
    "ALL",
    "AWAITING_PAYMENT",
    "PROCESSING",
    "CONFIRMED",
    "READY",
    "ON_GOING",
    "COMPLETED",
    "CANCELLED",
];

export default function StatusTabs({ activeTab, onTabChange, counts }: StatusTabsProps) {
    const t = useTranslations("orders");

    const tabLabels: Record<StatusType, string> = {
        ALL: t("tabs.all"),
        AWAITING_PAYMENT: t("tabs.awaiting_payment"),
        PROCESSING: t("tabs.processing"),
        CONFIRMED: t("tabs.confirmed"),
        READY: t("tabs.ready"),
        ON_GOING: t("tabs.on_going"),
        COMPLETED: t("tabs.completed"),
        CANCELLED: t("tabs.cancelled"),
    };

    // Only show tabs that have orders (ALL always visible)
    const visibleTabs = ALL_TABS.filter(
        (tab) => tab === "ALL" || (counts[tab] ?? 0) > 0,
    );

    return (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <ScrollArea className="w-full">
                <div className="flex gap-1.5 p-3">
                    {visibleTabs.map((tab) => {
                        const count = counts[tab] ?? 0;
                        const isActive = activeTab === tab;

                        return (
                            <button
                                key={tab}
                                onClick={() => onTabChange(tab)}
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all shrink-0",
                                    "text-xs font-medium",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                                )}
                            >
                                <span>{tabLabels[tab]}</span>
                                {count > 0 && (
                                    <span
                                        className={cn(
                                            "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold",
                                            isActive
                                                ? "bg-primary-foreground/20 text-primary-foreground"
                                                : "bg-background text-muted-foreground",
                                        )}
                                    >
                                        {count > 99 ? "99+" : count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
        </div>
    );
}
