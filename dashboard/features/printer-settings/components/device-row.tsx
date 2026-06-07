import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeviceRow({
    icon,
    label,
    type,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    type: "bluetooth" | "usb";
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group flex w-full items-center justify-between rounded-md",
                "border border-border/50 bg-muted/30 px-3.5 py-2.5",
                "text-left transition-colors duration-150",
                "hover:border-border hover:bg-muted/60",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            )}
        >
            <div className="flex items-center gap-3">
                {/* Type icon badge */}
                <div
                    className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded",
                        "border border-border/40",
                        type === "bluetooth"
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                            : "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400"
                    )}
                >
                    {icon}
                </div>
                {/* Labels */}
                <div>
                    <p className="text-[13px] font-medium leading-none text-foreground">
                        {label}
                    </p>
                    <p className="mt-1 text-[11px] capitalize text-muted-foreground">
                        {type}
                    </p>
                </div>
            </div>
            {/* Hover action hint */}
            <span
                className={cn(
                    "text-[11px] text-muted-foreground/60 transition-opacity duration-150",
                    "opacity-0 group-hover:opacity-100"
                )}
            >
                Hubungkan
                <ChevronRight className="ml-0.5 inline-block h-3 w-3" />
            </span>
        </button>
    );
}
