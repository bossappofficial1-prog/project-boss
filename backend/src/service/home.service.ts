import { HomeRepository } from "../repositories/home.repository";
import { BannerRepository } from "../repositories/banner.repository";

export async function getHomeSummaryService(searchQuery?: string) {
    const [umkm, transactions, memberships, outlets] = await Promise.all([
        HomeRepository.countVerifiedUmkm(),
        HomeRepository.countSuccessfulTransactions(),
        HomeRepository.countActiveMemberships(),
        HomeRepository.findTopOutlets(searchQuery)
    ]);

    const [popularItems, promos] = await Promise.all([
        HomeRepository.findPopularItems(),
        HomeRepository.findActivePromos()
    ]);

    // Additional home content: banners, categories, popular items, promos
    const rawBanners = await BannerRepository.findActiveBanners(5)
    const banners = rawBanners.map(b => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        imageUrl: b.imageUrl,
        cta: { type: b.ctaType || "url", payload: b.ctaPayload || "" }
    }))

    // Categories: lightweight static categories for quick navigation
    const categories = [
        { id: 'cat-food', slug: 'food', title: 'Makanan', description: 'Kuliner favorit di sekitarmu', icon: 'food' },
        { id: 'cat-drink', slug: 'drink', title: 'Minuman', description: 'Kopi, teh, dan minuman segar', icon: 'drink' },
        { id: 'cat-shop', slug: 'shop', title: 'Toko', description: 'Belanja kebutuhan harian', icon: 'shop' },
        { id: 'cat-service', slug: 'service', title: 'Jasa', description: 'Salon, bengkel, dan lainnya', icon: 'service' }
    ] as const;

    return {
        umkm,
        transactions,
        memberships,
        outlets,
        banners,
        categories,
        popularItems,
        promos
    };
}