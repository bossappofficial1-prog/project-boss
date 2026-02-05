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
    ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    TRIAL: 'bg-sky-100 text-sky-700 border-sky-200',
    AWAITING_PAYMENT: 'bg-amber-100 text-amber-700 border-amber-200',
    PROOF_SUBMITTED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    PAST_DUE: 'bg-orange-100 text-orange-700 border-orange-200',
    EXPIRED: 'bg-rose-100 text-rose-700 border-rose-200',
    SUSPENDED: 'bg-slate-200 text-slate-700 border-slate-300',
    CANCELLED: 'bg-gray-200 text-gray-700 border-gray-300',
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
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    PROOF_SUBMITTED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    AWAITING_VERIFICATION: 'bg-blue-100 text-blue-700 border-blue-200',
    SUCCESS: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    FAILED: 'bg-rose-100 text-rose-700 border-rose-200',
    REFUNDED: 'bg-slate-200 text-slate-700 border-slate-300',
    EXPIRED: 'bg-orange-100 text-orange-700 border-orange-200',
    CANCELLED: 'bg-gray-200 text-gray-700 border-gray-300',
    REJECTED_MANUAL: 'bg-red-100 text-red-700 border-red-200',
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
            accent: 'from-rose-50 to-white border-rose-100',
        },
        {
            key: 'products',
            label: 'Produk & Layanan',
            description: 'Item yang bisa dijual di semua outlet',
            icon: Package2,
            accent: 'from-orange-50 to-white border-orange-100',
        },
        {
            key: 'staff',
            label: 'Staf Outlet',
            description: 'Kasir dan petugas yang aktif',
            icon: Users,
            accent: 'from-amber-50 to-white border-amber-100',
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