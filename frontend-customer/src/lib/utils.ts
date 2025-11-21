import { clsx, type ClassValue } from "clsx"
import { RemotePattern } from "next/dist/shared/lib/image-config";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function parseRemotePatterns(patterns: string): RemotePattern[] {
    console.log(patterns);

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
        { protocol: 'https', hostname: 'bossapp.id', pathname: '/**' },
        { protocol: 'https', hostname: 'api.bossapp.id', pathname: '/**' },
        { protocol: 'https', hostname: 'dashboard.bossapp.id', pathname: '/**' },
        { protocol: 'http', hostname: 'localhost', pathname: '/**' }
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

export const formatDateTime = (timestamp: string, locale: string = 'id-ID') => {
    const formatted = new Date(timestamp).toLocaleString(locale, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    return locale.startsWith('id') ? formatted.replace("pukul", "").trim() : formatted;
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

export const toMapDestination = (latitude: string | number, longitude: string | number) => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(mapsUrl, "_blank");
}

export function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() ?? null;
    }
    return null;
}
