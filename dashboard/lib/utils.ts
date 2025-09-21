import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Format a number as currency in Indonesian Rupiah (IDR)
 * @param value - The numeric value to format
 * @param options - Optional formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
    value: number,
    options: {
        currency?: string;
        locale?: string;
        minimumFractionDigits?: number;
        maximumFractionDigits?: number;
    } = {}
): string {
    const {
        currency = 'IDR',
        locale = 'id-ID', // Indonesian locale for better Rupiah formatting
        minimumFractionDigits = 0,
        maximumFractionDigits = 0,
    } = options;

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
    }).format(value);
}

/**
 * Format date for chart display based on period
 * @param dateString - ISO date string
 * @param period - Time period ('daily', 'weekly', 'monthly')
 * @param options - Optional formatting options
 * @returns Formatted date string
 */
export function formatChartDate(
    dateString: string,
    period: 'daily' | 'weekly' | 'monthly',
    options: {
        locale?: string;
        timeZone?: string;
    } = {}
): string {
    const {
        locale = 'en-US',
        timeZone,
    } = options;

    const date = new Date(dateString);

    if (period === 'daily') {
        return date.toLocaleDateString(locale, {
            month: 'short',
            day: 'numeric',
            timeZone
        });
    } else if (period === 'weekly') {
        return `Week ${Math.ceil(date.getDate() / 7)}`;
    } else {
        return date.toLocaleDateString(locale, {
            month: 'short',
            year: 'numeric',
            timeZone
        });
    }
}
