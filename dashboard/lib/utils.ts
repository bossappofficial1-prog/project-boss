import { OperatingHours, OperatingHoursFormData } from "@/types/dashboard";
import { clsx, type ClassValue } from "clsx"
import { RemotePattern } from "next/dist/shared/lib/image-config";
import { useCallback } from "react";
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
    value: number | string,
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
    }).format(value as number);
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

export function formatISOStringDate(isoString: string) {
    const date = new Date(isoString)
    return date.toLocaleDateString(`id-ID`, {
        day: `numeric`,
        month: `long`,
        year: `numeric`
    })
}

export function parseRemotePatterns(patterns: string): RemotePattern[] {
    // Helper to extract a RemotePattern from a URL string
    const fromUrl = (urlStr: string): RemotePattern | null => {
        try {
            const url = new URL(urlStr);
            const proto = url.protocol.replace(':', '');
            const protocol = proto === 'http' || proto === 'https' ? (proto as 'http' | 'https') : undefined;
            const pattern: RemotePattern = {
                protocol,
                hostname: url.hostname,
                pathname: url.pathname === '/' ? '/**' : url.pathname
            } as RemotePattern;
            // Attach port if present
            // @ts-ignore next RemotePattern allows optional port in runtime even if type differs
            if (url.port) (pattern as any).port = url.port;
            return pattern;
        } catch {
            return null;
        }
    };

    const defaults: RemotePattern[] = [
        { protocol: 'https', hostname: 'bossapp.id' },
        { protocol: 'https', hostname: 'api.bossapp.id' },
        { protocol: 'https', hostname: 'dashboard.bossapp.id' },
        { protocol: 'http', hostname: 'localhost' }
    ];

    // Always include API origin if provided, so uploaded images served by API are allowed in dev/prod
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
        const p = fromUrl(apiUrl);
        if (p) {
            const key = `${p.protocol || ''}//${p.hostname}:${(p as any).port || ''}`;
            const seen = new Set(defaults.map(d => `${d.protocol || ''}//${d.hostname}:${(d as any).port || ''}`));
            if (!seen.has(key)) defaults.push(p);
        }
    }

    if (!patterns || patterns.trim() === '') {
        return defaults;
    }

    try {
        const parsed = patterns
            .split(',')
            .map((pattern) => {
                const trimmed = pattern.trim();
                if (!trimmed) return null;
                if (trimmed.includes('://')) return fromUrl(trimmed);
                // Hostname only -> assume https
                return { protocol: 'https' as const, hostname: trimmed, pathname: '/**' } as RemotePattern;
            })
            .filter(Boolean) as RemotePattern[];

        // Merge parsed with defaults (and API origin), avoiding duplicates
        const map = new Map<string, RemotePattern>();
        for (const p of [...defaults, ...parsed]) {
            const key = `${p.protocol || ''}//${p.hostname}:${(p as any).port || ''}${p.pathname || ''}`;
            map.set(key, p);
        }
        return Array.from(map.values());
    } catch (error) {
        console.warn('Error parsing remote patterns, using defaults:', error);
        return defaults;
    }
}

export const parseOperatingHours = (operatingHours: OperatingHours[]) => {
    const hoursMap: Record<number, OperatingHoursFormData> = {}
    operatingHours.forEach((hour: OperatingHours) => {
        // Convert ISO time strings to HH:MM format
        let openTime = '09:00'
        let closeTime = '17:00'

        if (hour.openTime) {
            const openDate = new Date(hour.openTime)
            openTime = openDate.toTimeString().slice(0, 5)
        }

        if (hour.closeTime) {
            const closeDate = new Date(hour.closeTime)
            closeTime = closeDate.toTimeString().slice(0, 5)
        }

        hoursMap[hour.dayOfWeek] = {
            id: hour.id,
            outletId: hour.outletId,
            dayOfWeek: hour.dayOfWeek,
            openTime: openTime,
            closeTime: closeTime,
            isOpen: hour.isOpen
        }
    })
    return hoursMap
}

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

export function formatNumberCompactID(value: number): string {
    if (value < 1000) return value.toString()

    const units = [
        { value: 1_000_000_000_000, symbol: " T" },
        { value: 1_000_000_000, symbol: " M" },
        { value: 1_000_000, symbol: " jt" },
        { value: 1_000, symbol: " rb" },
    ]

    for (const unit of units) {
        if (value >= unit.value) {
            const formatted = value / unit.value
            return `${removeTrailingZero(formatted.toFixed(2))}${unit.symbol}`
        }
    }

    return value.toString()
}

function removeTrailingZero(value: string) {
    return value.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")
}
