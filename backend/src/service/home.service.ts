import { HomeRepository } from "../repositories/home.repository";

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
    // Banners: using a few static images from public/uploads as featured promos
    const banners = [
        {
            id: 'banner-1',
            title: 'Diskon Spesial Akhir Pekan',
            subtitle: 'Hemat hingga 20% untuk pembelian pertama',
            imageUrl: '/uploads/image-1758479998961-708861805.png',
            cta: { type: 'promo', payload: '' }
        },
        {
            id: 'banner-2',
            title: 'Gratis Ongkir',
            subtitle: 'Untuk pesanan di atas Rp50.000',
            imageUrl: '/uploads/image-1758485702353-698978368.png',
            cta: { type: 'url', payload: '/promos' }
        }
    ]

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