export interface HomeBanner {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  imageUrl: string;
  cta?: {
    type: "url" | "none" | "deep-link";
    payload: string;
  } | null;
}

export interface HomeCategory {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  icon?: string | null;
}

export interface HomePopularItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  image?: string | null;
  soldCount: number;
}

export interface HomeOutletSummary {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  image?: string | null;
  isOpen?: boolean | null;
  isBreak?: boolean | null;
  business?: {
    name?: string | null;
  };
  _count?: {
    orders?: number | null;
  };
}

export interface HomePromo {
  id: string;
  code: string;
  description?: string | null;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  minPurchaseAmount: number | null;
  validFrom: string;
  validUntil: string;
}

export interface HomeSummaryResponse {
  umkm: number;
  transactions: number;
  outlets: HomeOutletSummary[];
  banners: HomeBanner[];
  categories: HomeCategory[];
  popularItems: HomePopularItem[];
  promos: HomePromo[];
}
