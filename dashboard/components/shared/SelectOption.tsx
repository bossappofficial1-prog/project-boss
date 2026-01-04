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
    disabled?: boolean;
    name?: string;
};

export function SelectOption<T extends BaseOption = BaseOption>({
    options,
    value,
    onValueChange,
    placeholder,
    label,
    className,
    disabled = false,
    name
}: SelectOptionProps<T>) {
    return (
        <Select
            value={value || 'default'}
            onValueChange={onValueChange}
            disabled={disabled}
            name={name}
        >
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
                    {placeholder && <SelectItem value="default" disabled>{placeholder}</SelectItem>}
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