// Utilities for resolving safe image URLs for next/image
import { parseRemotePatterns } from "./utils";

const DEFAULT_PLACEHOLDER = "/assets/images/default-image.png";

function getApiOrigin(): string | null {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    const u = new URL(apiUrl);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

function getAllowedRemoteHosts(): { protocol?: "http" | "https"; hostname: string }[] {
  const patterns = parseRemotePatterns(process.env.NEXT_PUBLIC_REMOTE_PATTERNS || "");
  return patterns.map(p => ({ protocol: p.protocol, hostname: p.hostname }));
}

function isAbsoluteHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function resolveCustomerImageUrl(src?: string | null): string {
  if (!src || typeof src !== "string") return DEFAULT_PLACEHOLDER;

  // Allow local/relative assets or uploads directly
  if (src.startsWith("/")) return src;

  // Allow protocol-relative URLs by rejecting them (to avoid surprises)
  if (src.startsWith("//")) return DEFAULT_PLACEHOLDER;

  // Only allow absolute http/https URLs if hostname is configured in next.config images.remotePatterns
  if (isAbsoluteHttpUrl(src)) {
    try {
      const u = new URL(src);
      const apiOrigin = getApiOrigin();

      // If this is an upload path on a different origin, rewrite to our API origin
      if (u.pathname.startsWith("/uploads") && apiOrigin) {
        return `${apiOrigin}${u.pathname}`;
      }

      const allowed = getAllowedRemoteHosts();
      const match = allowed.some(p => {
        const protoOk = !p.protocol || p.protocol === u.protocol.replace(":", "");
        return protoOk && p.hostname === u.hostname;
      });
      return match ? src : DEFAULT_PLACEHOLDER;
    } catch {
      return DEFAULT_PLACEHOLDER;
    }
  }

  // Any other scheme (data:, blob:, etc.) -> fallback to placeholder for safety with next/image
  return DEFAULT_PLACEHOLDER;
}

export const IMAGE_PLACEHOLDER = DEFAULT_PLACEHOLDER;
