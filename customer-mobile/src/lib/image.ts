const API_BASE = process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") || "http://10.74.3.211:1234";

const DEFAULT_PLACEHOLDER = "https://placehold.co/400x300/e5e5e5/737373?text=No+Image";

const LOCAL_DEFAULTS: Record<string, any> = {
  "/defaults/default-product-image.png": require("../../assets/images/default-product.png"),
  "/defaults/default-outlet-image.webp": require("../../assets/images/default-outlet.webp"),
  "/defaults/default-avatar.jpg": require("../../assets/images/default-avatar.jpg"),
};

export function resolveImageUrl(src?: string | null): string | number {
  if (!src || typeof src !== "string") return DEFAULT_PLACEHOLDER;
  if (LOCAL_DEFAULTS[src]) return LOCAL_DEFAULTS[src];
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return `${API_BASE}${src}`;
  return DEFAULT_PLACEHOLDER;
}

export function resolveImageSource(src?: string | null): { uri: string } | number {
  const resolved = resolveImageUrl(src);
  if (typeof resolved === "number") return resolved;
  return { uri: resolved };
}
