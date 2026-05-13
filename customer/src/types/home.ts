export interface HomeBanner {
    id: string
    title?: string | null
    subtitle?: string | null
    imageUrl: string
    cta?: { type: 'promo' | 'outlet' | 'url'; payload: string }
}

export interface HomeCategory {
    id: string
    slug: string
    title: string
    description?: string | null
    icon?: string | null
}

export interface HomePopularItem {
    id: string
    slug: string;
    name: string
    price: number
    image?: string | null
    soldCount: number
}

export interface HomePromo {
    id: string
    code: string
    description?: string | null
    type: 'PERCENTAGE' | 'FIXED_AMOUNT'
    value: number
    status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
    minPurchaseAmount: number | null
    validFrom: string | Date
    validUntil: string | Date
}

export interface HomeSummaryResponse {
    umkm: number
    transactions: number
    memberships: number
    outlets: HomeOutletSummary[]
    banners: HomeBanner[]
    categories: HomeCategory[]
    popularItems: HomePopularItem[]
    promos: HomePromo[]
}

export interface HomeOutletSummary {
    id: string
    name: string
    slug?: string;
    description?: string | null
    address?: string | null
    phone?: string | null
    image?: string | null
    isOpen?: boolean | null
    latitude?: number | null
    longitude?: number | null
    business?: {
        id?: string
        name?: string | null
    }
    _count?: {
        orders?: number | null
    }
    distance?: number | null
}
