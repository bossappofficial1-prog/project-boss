import { clsx, type ClassValue } from "clsx"
import { RemotePattern } from "next/dist/shared/lib/image-config";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseRemotePatterns(patterns: string): RemotePattern[] {
  return patterns.split(", ").map((pattern) => {
    const url = new URL(pattern.trim());

    const proto = url.protocol.replace(":", "");
    const protocol = proto === "http" || proto === "https" ? proto : undefined;

    return {
      protocol,
      hostname: url.hostname,
      pathname: url.pathname === "/" ? "/**" : url.pathname
    }
  })
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
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export const formatTime = (date: Date, locale: string = 'id-ID') =>
  date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
