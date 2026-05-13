const DEFAULT_PRIORITY = 0.5;

/**
 * Map key route groups to sitemap entries with friendly metadata.
 */
const STATIC_ROUTES = [
    {
        loc: '/',
        changefreq: 'daily',
        priority: 1.0,
    },
];

module.exports = {
    siteUrl: process.env.SITE_URL || 'https://your-domain.com',
    generateRobotsTxt: true,
    exclude: ['/payment-test', '/payment/*', '/snackbar-demo'],
    transform: async (config, path) => {
        if (STATIC_ROUTES.some((route) => route.loc === path)) {
            const match = STATIC_ROUTES.find((route) => route.loc === path);
            return {
                loc: path,
                changefreq: match?.changefreq,
                priority: match?.priority,
                lastmod: new Date().toISOString(),
            };
        }

        return {
            loc: path,
            changefreq: 'weekly',
            priority: DEFAULT_PRIORITY,
            lastmod: new Date().toISOString(),
        };
    },
    additionalPaths: async (config) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
            console.warn('[next-sitemap] NEXT_PUBLIC_API_URL tidak terisi, lewati penambahan outlet dinamis.');
            return [];
        }

        try {
            const response = await fetch(`${apiUrl}/api/v1/outlets/ids`);

            if (!response.ok) {
                console.warn(`{next-sitemap} Gagal fetch outlet IDs (status ${response.status}), lewati penambahan dinamis.`);
                return [];
            }

            const outlets = await response.json();

            if (!outlets?.data?.length) {
                return [];
            }

            return outlets.data.map((outlet) => ({
                loc: `/outlet/${outlet.id}`,
                lastmod: new Date().toISOString(),
                changefreq: 'weekly',
                priority: 0.7,
            }));
        } catch (error) {
            console.warn('[next-sitemap] Gagal mengambil outlets dinamis:', error);
            return [];
        }
    },
};