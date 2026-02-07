"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface DualOptionSwitchProps<T> {
    value: T;
    onValueChange: (value: T) => void;
    options: {
        left: {
            label: string;
            value: T;
            activeClass?: string;
            icon?: React.ComponentType<{ className?: string }>
        };
        right: {
            label: string;
            value: T;
            activeClass?: string;
            icon?: React.ComponentType<{ className?: string }>
        };
    };
    className?: string;
    id?: string;
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
                "inline-flex items-center justify-between gap-3 h-11 rounded-full border bg-background/50 px-4 py-2 shadow-sm transition-all hover:bg-accent/5",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
        >
            {/* --- LEFT OPTION --- */}
            <LabelButton
                isActive={!isRightSelected}
                onClick={() => !disabled && onValueChange(options.left.value)}
                icon={options.left.icon}
                label={options.left.label}
                activeClass={options.left.activeClass}
                position="left"
            />

            {/* --- SWITCH CONTROL --- */}
            <Switch
                id={id}
                checked={isRightSelected}
                disabled={disabled}
                onCheckedChange={(checked) =>
                    onValueChange(checked ? options.right.value : options.left.value)
                }
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
            />

            {/* --- RIGHT OPTION --- */}
            <LabelButton
                isActive={isRightSelected}
                onClick={() => !disabled && onValueChange(options.right.value)}
                icon={options.right.icon}
                label={options.right.label}
                activeClass={options.right.activeClass}
                position="right"
            />
        </div>
    );
}

interface LabelButtonProps {
    isActive: boolean;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
    label: string;
    activeClass?: string;
    position: "left" | "right";
}

function LabelButton({ isActive, onClick, icon: Icon, label, activeClass, position }: LabelButtonProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group flex items-center gap-2 cursor-pointer select-none transition-all duration-300",
                isActive
                    ? (activeClass ?? "text-foreground font-semibold")
                    : "text-muted-foreground font-medium hover:text-foreground/80",
                position === "right" && "flex-row-reverse"
            )}
        >
            {/* ICON AREA */}
            {Icon && (
                <span className={cn(
                    "flex items-center justify-center transition-transform duration-300",
                    isActive ? "scale-110 opacity-100" : "scale-100 opacity-70 group-hover:opacity-100"
                )}>
                    <Icon className="h-4 w-4" />
                </span>
            )}

            {/* LABEL AREA */}
            <span className={cn(
                "text-sm transition-all",
                Icon ? "hidden sm:inline-block" : "inline-block"
            )}>
                {label}
            </span>
        </div>
    );
}