import React from "react";
import { cn } from "@/lib/utils";

export function ConnectCard({
    icon,
    label,
    sub,
    onClick,
    disabled,
}: {
    icon: React.ReactNode;
    label: string;
    sub: string;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "group flex flex-col items-start gap-2.5 rounded-md",
                "border border-border/50 bg-muted/30 p-4 text-left",
                "transition-colors duration-150",
                "hover:border-border hover:bg-muted/60",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-40"
            )}
        >
            <div
                className={cn(
                    "flex h-8 w-8 items-center justify-center rounded",
                    "border border-border/40 bg-background",
                    "text-muted-foreground transition-colors group-hover:text-foreground"
                )}
            >
                {icon}
            </div>
            <div>
                <p className="text-[13px] font-medium text-foreground">{label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
            </div>
        </button>
    );
}
