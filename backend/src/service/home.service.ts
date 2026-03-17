import { HomeRepository } from "../repositories/home.repository";
import { BannerRepository } from "../repositories/banner.repository";

export async function getHomeSummaryService(searchQuery?: string) {
    const [umkm, transactions, outlets, popularItems, rawBanners] = await Promise.all([
        HomeRepository.countVerifiedUmkm(),
        HomeRepository.countSuccessfulTransactions(),
        HomeRepository.findTopOutlets(searchQuery),
        HomeRepository.findPopularItems(),
        BannerRepository.findActiveBanners(100)
    ]);

    const banners = rawBanners.map(b => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        imageUrl: b.imageUrl,
        cta: { type: b.ctaType || "url", payload: b.ctaPayload || "" }
    }))

    const categories = [
        { id: 'cat-food', slug: 'food', title: 'Makanan', description: 'Kuliner favorit di sekitarmu', icon: 'food' },
        { id: 'cat-drink', slug: 'drink', title: 'Minuman', description: 'Kopi, teh, dan minuman segar', icon: 'drink' },
        { id: 'cat-shop', slug: 'shop', title: 'Toko', description: 'Belanja kebutuhan harian', icon: 'shop' },
        { id: 'cat-service', slug: 'service', title: 'Jasa', description: 'Salon, bengkel, dan lainnya', icon: 'service' }
    ] as const;

    return {
        umkm,
        transactions,
        outlets,
        banners,
        categories,
        popularItems
    };
}