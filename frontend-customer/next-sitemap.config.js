module.exports = {
    siteUrl: process.env.SITE_URL || 'https://your-domain.com',
    generateRobotsTxt: true,
    // Contoh: generate halaman dinamis
    additionalPaths: async (config) => {
        const outlets = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/outlets?take=100000`).then(res => res.json());

        return outlets.data.map(outlet => ({
            loc: `/outlet/${outlet.id}`,
            lastmod: new Date().toISOString(),
        }));
    },
}