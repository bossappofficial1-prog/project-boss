"use client";

import { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GoodsOrder, OrderStatus } from '@/lib/apis/order';
import { cn } from '@/lib/utils';
import { getOrderStatusLabel, getOrderStatusOptions } from './utils';

interface OrderStatusSelectProps {
    order: GoodsOrder;
    value: OrderStatus;
    disabled?: boolean;
    onStatusChange: (order: GoodsOrder, status: OrderStatus) => void;
}

const STATUS_THEME: Record<OrderStatus, string> = {
    AWAITING_PAYMENT: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200',
    PROCESSING: 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200',
    CONFIRMED: 'bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200',
    READY: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200',
    ON_GOING: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-900/40 dark:text-cyan-200',
    COMPLETED: 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200',
    CANCELLED: 'bg-gray-200 text-gray-800 dark:bg-gray-800/50 dark:text-gray-200',
};

export function OrderStatusSelect({ order, value, disabled, onStatusChange }: OrderStatusSelectProps) {
    const options = useMemo(() => getOrderStatusOptions(), []);
    const theme = STATUS_THEME[value] ?? 'bg-muted text-foreground';

    return (
        <Select
            value={value}
            onValueChange={(next) => onStatusChange(order, next as OrderStatus)}
            disabled={disabled}
        >
            <SelectTrigger
                className={cn(
                    'h-8 w-[180px] justify-center rounded-full border-0 px-3 text-xs font-semibold shadow-none focus:ring-0 focus-visible:ring-0',
                    theme,
                    disabled && 'opacity-60 cursor-not-allowed'
                )}
            >
                <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-xs">
                        {getOrderStatusLabel(option.value)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
