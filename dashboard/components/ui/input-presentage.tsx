"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface InputPercentageProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
    value?: number;
    onValueChange?: (value: number | undefined) => void;
}

export const InputPercentage = React.forwardRef<
    HTMLInputElement,
    InputPercentageProps
>(({ value, onValueChange, className, ...props }, ref) => {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;

        if (rawValue === "") {
            onValueChange?.(undefined);
            return;
        }

        let num = parseFloat(rawValue);

        if (isNaN(num)) return;

        // 4. Clamp nilai antara 0-100
        if (num > 100) num = 100;
        if (num < 0) num = 0;

        onValueChange?.(num);
    };

    return (
        <div className="relative">
            <Input
                {...props}
                ref={ref}
                type="number"
                value={value !== undefined ? value : ""}
                onChange={handleChange}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className={cn("pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none", className)}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                %
            </span>
        </div>
    );
});

InputPercentage.displayName = "InputPercentage";