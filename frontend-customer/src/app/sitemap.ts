import type { MetadataRoute } from "next";

const SITE_URL = process.env.SITE_URL || "https://bossapp.id";

const STATIC_ROUTES: Array<{
    path: string;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: MetadataRoute.Sitemap[number]["priority"];
}> = [
        { path: "/", changeFrequency: "daily", priority: 1 },
        { path: "/offline", changeFrequency: "yearly", priority: 0.2 },
        { path: "/cart", changeFrequency: "weekly", priority: 0.4 },
        { path: "/checkout", changeFrequency: "weekly", priority: 0.4 },
        { path: "/favorites", changeFrequency: "weekly", priority: 0.5 },
        { path: "/nearby", changeFrequency: "weekly", priority: 0.6 },
        { path: "/orders", changeFrequency: "weekly", priority: 0.6 },
        { path: "/profile", changeFrequency: "monthly", priority: 0.3 },
        { path: "/saved-products", changeFrequency: "weekly", priority: 0.5 },
        { path: "/search", changeFrequency: "weekly", priority: 0.5 },
    ];

const EXCLUDED_PREFIXES = ["/payment-test", "/payment", "/snackbar-demo"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const generatedAt = new Date();
    const entries: MetadataRoute.Sitemap = [];

    for (const route of STATIC_ROUTES) {
        if (shouldExclude(route.path)) {
            continue;
        }

        entries.push({
            url: buildAbsoluteUrl(route.path),
            lastModified: generatedAt,
            changeFrequency: route.changeFrequency,
            priority: route.priority,
        });
    }

    const outletEntries = await buildOutletEntries(generatedAt);
    entries.push(...outletEntries);

    return entries;
}

function shouldExclude(path: string): boolean {
    return EXCLUDED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function buildAbsoluteUrl(path: string): string {
    return new URL(path, SITE_URL).toString();
}

async function buildOutletEntries(lastModified: Date): Promise<MetadataRoute.Sitemap> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
        console.warn("[sitemap] NEXT_PUBLIC_API_URL tidak ditemukan; lewati outlet dinamis.");
        return [];
    }

    try {
        const response = await fetch(`${apiUrl}/api/v1/outlets/ids`, {
            next: { revalidate: 60 * 60 },
        });

        if (!response.ok) {
            console.warn(`{sitemap} Gagal fetch outlet IDs (status ${response.status}); lewati outlet dinamis.`);
            return [];
        }

        const payload = await response.json();

        if (!Array.isArray(payload?.data)) {
            console.warn("[sitemap] Format respons outlets tidak sesuai; lewati outlet dinamis.");
            return [];
        }

        return payload.data.map((outlet: { id: string | number }) => ({
            url: buildAbsoluteUrl(`/outlet/${outlet.id}`),
            lastModified,
            changeFrequency: "weekly",
            priority: 0.7,
        }));
    } catch (error) {
        console.warn("[sitemap] Gagal mengambil data outlet dinamis:", error);
        return [];
    }
}
