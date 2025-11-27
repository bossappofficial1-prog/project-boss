'use client'

import React from "react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from "../ui/select";

type BaseOption = {
    value: string;
    label: string;
};

type SelectOptionProps<T extends BaseOption = BaseOption> = {
    options: readonly T[];
    value: T['value'];
    onValueChange: (value: T['value']) => void;
    placeholder?: string | React.ReactNode;
    label?: string;
    className?: string;
};

export function SelectOption<T extends BaseOption = BaseOption>({
    options,
    value,
    onValueChange,
    placeholder,
    label,
    className,
}: SelectOptionProps<T>) {
    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className={className ?? "w-full"}>
                {
                    typeof placeholder == `string`
                        ? <SelectValue placeholder={placeholder || `Pick to select`} />
                        : placeholder
                }
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {label ? <SelectLabel>{label}</SelectLabel> : null}
                    {options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}