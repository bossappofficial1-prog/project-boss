"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface DualOptionSwitchProps<T> {
    value: T;
    id?: string;
    onValueChange: (value: T) => void;
    options: {
        left: { label: string; value: T; activeClass?: string };
        right: { label: string; value: T; activeClass?: string };
    };
    className?: string;
    disabled?: boolean;
}

export function DualOptionSwitch<T>({
    value,
    onValueChange,
    options,
    className,
    id,
    disabled
}: DualOptionSwitchProps<T>) {
    const isRightSelected = value === options.right.value;

    return (
        <div
            className={cn(
                "flex items-center justify-between rounded-lg border h-11 px-4 py-3 shadow-sm hover:shadow-md transition-all duration-200",
                className
            )}
        >
            {/* Opsi Kiri */}
            <span
                className={cn(
                    "text-sm font-medium transition-colors cursor-pointer",
                    !isRightSelected
                        ? (options.left.activeClass ?? "text-primary")
                        : "text-muted-foreground"
                )}
                onClick={() => onValueChange(options.left.value)}
            >
                {options.left.label}
            </span>

            <Switch
                id={id}
                checked={isRightSelected}
                disabled={disabled}
                onCheckedChange={(checked) =>
                    onValueChange(checked ? options.right.value : options.left.value)
                }
            />

            {/* Opsi Kanan */}
            <span
                className={cn(
                    "text-sm font-medium transition-colors cursor-pointer",
                    isRightSelected
                        ? (options.right.activeClass ?? "text-primary")
                        : "text-muted-foreground"
                )}
                onClick={() => onValueChange(options.right.value)}
            >
                {options.right.label}
            </span>
        </div>
    );
}