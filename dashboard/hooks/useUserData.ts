import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apis/base';

interface Outlet {
    id: string;
    name: string;
    address: string;
    phone?: string;
    latitude?: number;
    longitude?: number;
    imageUrl?: string;
}

interface Business {
    id: string;
    name: string;
    description?: string;
    type?: string;
    address?: string;
    phone?: string;
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    transactionFeeBearer?: string;
    subscriptionPlan?: string;
}

interface UserData {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        avatar?: string
        // Add other user fields as needed
    };
    outlets: Outlet[];
    business: Business | null;
}

const USER_DATA_SESSION_CACHE_KEY = 'user-data-cache-v1';

function readCachedUserData(): UserData | undefined {
    try {
        if (typeof window === 'undefined') return undefined;
        const raw = sessionStorage.getItem(USER_DATA_SESSION_CACHE_KEY);
        if (!raw) return undefined;
        const parsed = JSON.parse(raw);
        if (!parsed?.user?.id) return undefined;
        return parsed as UserData;
    } catch {
        return undefined;
    }
}

// Query function for fetching user data
const fetchUserData = async (): Promise<UserData> => {
    try {
        const response = await apiClient.get('/auth/me');
        const data = response.data.data as UserData;
        try {
            sessionStorage.setItem(USER_DATA_SESSION_CACHE_KEY, JSON.stringify(data));
        } catch { }
        return data;
    } catch (err) {
        if (typeof window !== 'undefined') {
            const cashierRaw = sessionStorage.getItem('cashier-auth-cache-v1');
            if (cashierRaw) {
                const cashierData = JSON.parse(cashierRaw);
                return {
                    user: {
                        id: cashierData.id,
                        name: cashierData.name,
                        email: cashierData.email || '',
                        role: cashierData.role,
                    },
                    outlets: cashierData.outlet ? [cashierData.outlet] : [],
                    business: {
                        id: cashierData.businessId || 'manager-business',
                        name: 'BOSS Business',
                        subscriptionPlan: 'PRO',
                    }
                };
            }
        }
        throw err;
    }
};

export function useUserData() {
    return useQuery({
        queryKey: ['user-data'],
        queryFn: fetchUserData,
        staleTime: 5 * 60_000,
        gcTime: 30 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 1,
        initialData: readCachedUserData,
    });
}