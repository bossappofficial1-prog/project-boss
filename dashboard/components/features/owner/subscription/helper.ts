import { OwnerPaymentStatus, OwnerSubscriptionStatus, SubscriptionPlanFeatures } from "@/lib/apis/owner-subscription";
import { Package2, Store, Users } from "lucide-react";


export const SUBSCRIPTION_STATUS_LABELS: Record<OwnerSubscriptionStatus, string> = {
    ACTIVE: 'Aktif',
    TRIAL: 'Masa Uji Coba',
    AWAITING_PAYMENT: 'Menunggu Pembayaran',
    PROOF_SUBMITTED: 'Bukti Dikirim',
    PAST_DUE: 'Tertunggak',
    EXPIRED: 'Berakhir',
    SUSPENDED: 'Ditangguhkan',
    CANCELLED: 'Dibatalkan',
};

export const SUBSCRIPTION_STATUS_STYLES: Record<OwnerSubscriptionStatus, string> = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    TRIAL: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
    AWAITING_PAYMENT: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    PROOF_SUBMITTED: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    PAST_DUE: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    EXPIRED: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    SUSPENDED: 'bg-muted text-muted-foreground border-border',
    CANCELLED: 'bg-muted text-muted-foreground border-border',
};

export const PAYMENT_STATUS_LABELS: Record<OwnerPaymentStatus, string> = {
    PENDING: 'Menunggu Pembayaran',
    PROOF_SUBMITTED: 'Bukti Dikirim',
    AWAITING_VERIFICATION: 'Menunggu Verifikasi',
    SUCCESS: 'Berhasil',
    FAILED: 'Gagal',
    REFUNDED: 'Dana Dikembalikan',
    EXPIRED: 'Kadaluarsa',
    CANCELLED: 'Dibatalkan',
    REJECTED_MANUAL: 'Ditolak',
};

export const PAYMENT_STATUS_STYLES: Record<OwnerPaymentStatus, string> = {
    PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    PROOF_SUBMITTED: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    AWAITING_VERIFICATION: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    SUCCESS: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    FAILED: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    REFUNDED: 'bg-muted text-muted-foreground border-border',
    EXPIRED: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    CANCELLED: 'bg-muted text-muted-foreground border-border',
    REJECTED_MANUAL: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export const PAYMENT_ACTIONABLE_STATUSES: OwnerPaymentStatus[] = ['PENDING', 'PROOF_SUBMITTED', 'AWAITING_VERIFICATION'];


type UsageMetric = 'outlets' | 'products' | 'staff';

export const usageCardsConfig: Array<{
    key: UsageMetric;
    label: string;
    description: string;
    icon: React.ElementType;
    accent: string;
}> = [
        {
            key: 'outlets',
            label: 'Outlet Aktif',
            description: 'Jumlah outlet yang sedang berjalan',
            icon: Store,
            accent: 'border-border',
        },
        {
            key: 'products',
            label: 'Produk & Layanan',
            description: 'Item yang bisa dijual di semua outlet',
            icon: Package2,
            accent: 'border-border',
        },
        {
            key: 'staff',
            label: 'Staf Outlet',
            description: 'Kasir dan petugas yang aktif',
            icon: Users,
            accent: 'border-border',
        },
    ];

export const parsePlanFeatures = (raw: unknown): SubscriptionPlanFeatures | null => {
    if (!raw) return null;
    if (typeof raw === 'object') return raw as SubscriptionPlanFeatures;
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw) as SubscriptionPlanFeatures;
        } catch {
            return null;
        }
    }
    return null;
};

export const formatLimitLabel = (limit?: number) => {
    if (limit === undefined || limit === null) return 'Tidak tersedia';
    if (limit === -1) return 'Tanpa batas';
    return `${limit.toLocaleString('id-ID')} slot`;
};

export const calcUsagePercentage = (used?: number, limit?: number) => {
    if (limit === undefined || limit === null || limit <= 0) return 0;
    if (limit === -1) return 0;
    return Math.min(Math.round((Number(used ?? 0) / limit) * 100), 100);
};

export const getDaysRemaining = (dateString?: string | null) => {
    if (!dateString) return null;
    const end = new Date(dateString).getTime();
    if (Number.isNaN(end)) return null;
    const diff = end - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};