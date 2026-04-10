import { HomeRepository } from "../repositories/home.repository";
import { BannerRepository } from "../repositories/banner.repository";
import { RedisUtils } from "../utils/redis.utils";

let homeSummaryCache: any = null;
let lastCacheUpdate = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 Menit

export async function getHomeSummaryService(searchQuery?: string) {
    if (!searchQuery && homeSummaryCache && (Date.now() - lastCacheUpdate < CACHE_DURATION_MS)) {
        return homeSummaryCache;
    }

    const [umkm, transactions, outlets, popularItems, rawBanners] = await Promise.all([
        HomeRepository.countVerifiedUmkm(),
        HomeRepository.countSuccessfulTransactions(),
        HomeRepository.findTopOutlets(searchQuery),
        HomeRepository.findPopularItems(8),
        BannerRepository.findActiveBanners(100)
    ]);

    const banners = rawBanners.map(b => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        imageUrl: b.imageUrl,
        cta: { type: b.ctaType || "url", payload: b.ctaPayload || "" }
    }));

    const categories = [
        { id: 'cat-food', slug: 'food', title: 'Makanan', description: 'Kuliner favorit di sekitarmu', icon: 'food' },
        { id: 'cat-drink', slug: 'drink', title: 'Minuman', description: 'Kopi, teh, dan minuman segar', icon: 'drink' },
        { id: 'cat-shop', slug: 'shop', title: 'Toko', description: 'Belanja kebutuhan harian', icon: 'shop' },
        { id: 'cat-service', slug: 'service', title: 'Jasa', description: 'Salon, bengkel, dan lainnya', icon: 'service' }
    ] as const;

    const result = { umkm, transactions, outlets, banners, categories, popularItems };

    // Jika ini BUKAN hasil pencarian, simpan hasilnya ke Cache
    if (!searchQuery) {
        homeSummaryCache = result;
        lastCacheUpdate = Date.now();
    }

    return result;
}