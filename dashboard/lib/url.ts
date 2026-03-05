export function getApiOrigin(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  try {
    const u = new URL(base);
    // If base includes /api/... strip the pathname to origin
    return `${u.protocol}//${u.host}`;
  } catch {
    return '';
  }
}

export function resolveUploadImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const apiOrigin = getApiOrigin();
  try {
    const u = new URL(url);
    // If the path looks like an uploads path but origin differs from API origin, rewrite to API origin
    if (u.pathname.startsWith('/uploads') && apiOrigin && `${u.protocol}//${u.host}` !== apiOrigin) {
      return `${apiOrigin}${u.pathname}`;
    }
    return url;
  } catch {
    // If it's a relative path (e.g., /uploads/...), prepend API origin
    if (url.startsWith('/uploads') && apiOrigin) {
      return `${apiOrigin}${url}`;
    }
    return url;
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Gagal menyalin teks:", error);
    return false;
  }
}