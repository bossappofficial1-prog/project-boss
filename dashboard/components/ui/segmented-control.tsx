"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type SegmentedOption = {
    label: string;
    value: string;
    icon?: React.ReactNode;
    disabled?: boolean;
};

type SizeVariant = "xs" | "sm" | "md" | "lg";

interface BaseProps {
    options: SegmentedOption[];
    size?: SizeVariant;
    className?: string;
    fullWidth?: boolean;
    id?: string;
    disabled?: boolean;
}

type SingleProps = BaseProps & {
    multiple?: false;
    value: string;
    onChange: (value: string) => void;
};

type MultipleProps = BaseProps & {
    multiple: true;
    value: string[];
    onChange: (value: string[]) => void;
};

type SegmentedControlProps = SingleProps | MultipleProps;

const containerSizeClasses: Record<SizeVariant, string> = {
    xs: "gap-1",
    sm: "gap-1.5",
    md: "gap-2",
    lg: "gap-2.5",
};

const itemSizeClasses: Record<SizeVariant, string> = {
    xs: "h-7 px-3 text-[10px] rounded-md",
    sm: "h-9 px-4 text-xs rounded-lg",
    md: "h-11 px-6 text-sm rounded-xl",
    lg: "h-13 px-8 text-base rounded-2xl",
};

export function SegmentedControl(props: SegmentedControlProps) {
    const {
        options,
        value,
        onChange,
        size = "md",
        multiple = false,
        fullWidth = false,
        className,
        id,
        disabled = false,
    } = props;

    const handleValueChange = (val: string | string[]) => {
        if (disabled) return;

        if (multiple) {
            (onChange as (v: string[]) => void)(val as string[]);
        } else {
            if (val) {
                (onChange as (v: string) => void)(val as string);
            }
        }
    };

    return (
        <ToggleGroupPrimitive.Root
            id={id}
            type={multiple ? "multiple" : "single"}
            value={value as any}
            onValueChange={handleValueChange}
            disabled={disabled}
            className={cn(
                "inline-flex items-center bg-transparent",
                fullWidth && "w-full flex",
                containerSizeClasses[size],
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
        >
            {options.map((opt) => {
                const isActive = multiple
                    ? (value as string[]).includes(opt.value)
                    : value === opt.value;

                return (
                    <ToggleGroupPrimitive.Item
                        key={opt.value}
                        value={opt.value}
                        disabled={opt.disabled || disabled}
                        className={cn(
                            "relative flex items-center justify-center whitespace-nowrap font-bold uppercase tracking-wider transition-all focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none",
                            itemSizeClasses[size],
                            fullWidth ? "flex-1" : "min-w-[80px]",
                            isActive
                                ? "text-background border-transparent"
                                : "text-muted-foreground bg-background border border-border/60 hover:bg-accent hover:text-foreground shadow-sm"
                        )}
                    >
                        <AnimatePresence>
                            {isActive && (
                                <motion.div
                                    layoutId={id || "segmented-active-item"}
                                    className={cn(
                                        "absolute inset-0 bg-foreground shadow-md",
                                        size === "xs" ? "rounded-md" :
                                            size === "sm" ? "rounded-lg" :
                                                size === "md" ? "rounded-xl" : "rounded-2xl"
                                    )}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30,
                                    }}
                                />
                            )}
                        </AnimatePresence>

                        {/* Kandungan Item */}
                        <span className="relative z-20 flex items-center gap-2">
                            {opt.icon && (
                                <span className={cn(
                                    "shrink-0 transition-transform",
                                    isActive ? "scale-110" : "scale-100 opacity-70"
                                )}>
                                    {opt.icon}
                                </span>
                            )}
                            <span className="truncate">{opt.label}</span>
                        </span>
                    </ToggleGroupPrimitive.Item>
                );
            })}
        </ToggleGroupPrimitive.Root>
    );
}

export default SegmentedControl;