import type { MetadataRoute } from "next";

const SITE_URL = process.env.SITE_URL || "https://bossapp.id";
const API_URL = process.env.SERVER_API_URL;

const STATIC_ROUTES: Array<{
    path: string;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: MetadataRoute.Sitemap[number]["priority"];
}> = [
        { path: "/", changeFrequency: "daily", priority: 1 },
        { path: "/cart", changeFrequency: "weekly", priority: 0.4 },
        { path: "/checkout", changeFrequency: "weekly", priority: 0.4 },
        { path: "/favorites", changeFrequency: "weekly", priority: 0.5 },
        { path: "/nearby", changeFrequency: "weekly", priority: 0.6 },
        { path: "/orders", changeFrequency: "weekly", priority: 0.6 },
        { path: "/profile", changeFrequency: "monthly", priority: 0.3 },
    ];

const EXCLUDED_PREFIXES = new Set([
    "/payment-test",
    "/payment",
    "/snackbar-demo",
]);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const lastModified = new Date().toISOString();

    const staticEntries = STATIC_ROUTES
        .filter((route) => !shouldExclude(route.path))
        .map((route) => ({
            url: `${SITE_URL}${route.path}`,
            lastModified,
            changeFrequency: route.changeFrequency,
            priority: route.priority,
        }));

    const outletEntries = await buildOutletEntries(lastModified);

    return [...staticEntries, ...outletEntries];
}

function shouldExclude(path: string): boolean {
    for (const prefix of EXCLUDED_PREFIXES) {
        if (path === prefix || path.startsWith(prefix + "/")) {
            return true;
        }
    }
    return false;
}

async function buildOutletEntries(lastModified: string): Promise<MetadataRoute.Sitemap> {
    if (!API_URL) return [];

    try {
        const res = await fetch(`${API_URL}/outlets/slugs`, {
            next: { revalidate: 3600 },
        });

        if (!res.ok) return [];

        const payload = await res.json();

        if (!Array.isArray(payload?.data)) return [];

        return payload.data.map((outlet: { slug: string }) => ({
            url: `${SITE_URL}/outlet/${outlet.slug}`,
            lastModified,
            changeFrequency: "weekly",
            priority: 0.7,
        }));
    } catch {
        return [];
    }
}