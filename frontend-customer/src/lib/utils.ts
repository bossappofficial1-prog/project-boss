import { clsx, type ClassValue } from "clsx"
import { RemotePattern } from "next/dist/shared/lib/image-config";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function parseRemotePatterns(patterns: string): RemotePattern[] {
    if (!patterns || patterns.trim() === '') {
        // Return default patterns if no environment variable is set
        return [
            {
                protocol: 'https',
                hostname: 'bossapp.id',
            },
            {
                protocol: 'https',
                hostname: 'api.bossapp.id',
            },
            {
                protocol: 'https',
                hostname: 'dashboard.bossapp.id',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
            }
        ];
    }

    try {
        return patterns.split(',').map((pattern) => {
            const trimmed = pattern.trim();
            if (!trimmed) return null;

            // Simple pattern parsing - you can enhance this based on your needs
            if (trimmed.includes('://')) {
                const url = new URL(trimmed);
                const proto = url.protocol.replace(':', '');
                const protocol = proto === 'http' || proto === 'https' ? proto : undefined;

                return {
                    protocol: protocol as 'http' | 'https' | undefined,
                    hostname: url.hostname,
                    pathname: url.pathname === '/' ? '/**' : url.pathname
                };
            } else {
                // Assume https if no protocol specified
                return {
                    protocol: 'https' as const,
                    hostname: trimmed,
                    pathname: '/**'
                };
            }
        }).filter(Boolean) as RemotePattern[];
    } catch (error) {
        console.warn('Error parsing remote patterns, using defaults:', error);
        return [
            {
                protocol: 'https',
                hostname: 'bossapp.id',
            },
            {
                protocol: 'https',
                hostname: 'api.bossapp.id',
            },
            {
                protocol: 'https',
                hostname: 'dashboard.bossapp.id',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
            }
        ];
    }
}

export const formatIsoToTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export const isRouteDisabled = (pathname: string, disabledRoutes: string[]) => {
    return disabledRoutes.some((pattern) => {
        if (pattern.endsWith("/**")) {
            const basePattern = pattern.slice(0, -3);
            const regexPattern = basePattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&") + "(/.*)?";
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(pathname);
        }

        // Untuk kasus biasa dan '*'
        const regexPattern = pattern
            .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // Escape
            .replace(/\*/g, "[^/]*"); // Handle '*'

        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(pathname);
    });
};

export const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).replace("pukul", "")
}

export const formatTime = (date: Date, locale: string = 'id-ID') =>
    date.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

export async function copyToClipboard(text: string): Promise<boolean> {
    if (!navigator.clipboard) {
        console.error('Clipboard API not available');
        return false;
    }
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy text: ', err);
        return false;
    }
}