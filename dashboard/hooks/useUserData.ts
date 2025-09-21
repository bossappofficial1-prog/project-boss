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
}

interface UserData {
    user: {
        id: string;
        email: string;
        role: string;
        // Add other user fields as needed
    };
    outlets: Outlet[];
    business: Business | null;
}

// Query function for fetching user data
const fetchUserData = async (): Promise<UserData> => {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
};

export function useUserData() {
    return useQuery({
        queryKey: ['user-data'],
        queryFn: fetchUserData,
    });
}