import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apis/base';

export interface Product {
    id: string;
    name: string;
    description?: string;
    costPrice: number;
    price: number;
    type: 'GOODS' | 'SERVICE';
    quantity?: number;
    unit?: string;
    status: 'ACTIVE' | 'INACTIVE';
    serviceDurationMinutes?: number;
    image?: string;
    outletId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProductFilters {
    page?: number;
    limit?: number;
    search?: string;
}

export interface CreateProductData {
    name: string;
    description?: string;
    costPrice: number;
    price: number;
    type: 'GOODS' | 'SERVICE';
    quantity?: number;
    unit?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    serviceDurationMinutes?: number;
    image?: string;
    outletId: string;
}

export interface UpdateProductData {
    name?: string;
    description?: string;
    costPrice?: number;
    price?: number;
    type?: 'GOODS' | 'SERVICE';
    quantity?: number;
    unit?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    serviceDurationMinutes?: number;
    image?: string;
}

export interface StockUpdateData {
    type: 'adjustment' | 'add' | 'subtract';
    quantity: number;
    reason: string;
    notes?: string;
}

// Query hooks
export const useProducts = (outletId: string, filters?: ProductFilters) => {
    return useQuery({
        queryKey: ['products', outletId, filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.limit) params.append('limit', filters.limit.toString());
            if (filters?.search) params.append('q', filters.search);

            const queryString = params.toString();
            const endpoint = `/products/outlet/${outletId}${queryString ? `?${queryString}` : ''}`;

            const response = await apiClient.get(endpoint);
            return response.data.data;
        },
        enabled: !!outletId,
    });
};

export const useProduct = (productId: string) => {
    return useQuery({
        queryKey: ['product', productId],
        queryFn: async () => {
            const response = await apiClient.get(`/products/${productId}`);
            return response.data.data;
        },
        enabled: !!productId,
    });
};

export const useSearchProducts = (query: string) => {
    return useQuery({
        queryKey: ['products-search', query],
        queryFn: async () => {
            const response = await apiClient.get(`/products/search?name=${encodeURIComponent(query)}`);
            return response.data.data;
        },
        enabled: !!query && query.length > 2,
    });
};

// Mutation hooks
export const useCreateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (productData: CreateProductData) => {
            const response = await apiClient.post('/products', productData);
            return response.data.data;
        },
        onSuccess: (data) => {
            // Invalidate and refetch products for the outlet
            queryClient.invalidateQueries({ queryKey: ['products', data.outletId] });
        },
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, productData }: { productId: string; productData: UpdateProductData }) => {
            const response = await apiClient.patch(`/products/${productId}`, productData);
            return response.data.data;
        },
        onSuccess: (data) => {
            // Invalidate product detail and product list
            queryClient.invalidateQueries({ queryKey: ['product', data.id] });
            queryClient.invalidateQueries({ queryKey: ['products', data.outletId] });
        },
    });
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (productId: string) => {
            await apiClient.delete(`/products/${productId}`);
            return productId;
        },
        onSuccess: (productId) => {
            // Invalidate product queries
            queryClient.invalidateQueries({ queryKey: ['product', productId] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
};

export const useUpdateProductStock = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, stockData }: { productId: string; stockData: StockUpdateData }) => {
            const response = await apiClient.patch(`/products/${productId}/stock`, stockData);
            return response.data.data;
        },
        onSuccess: (data) => {
            // Invalidate product detail
            queryClient.invalidateQueries({ queryKey: ['product', data.id] });
            queryClient.invalidateQueries({ queryKey: ['products', data.outletId] });
        },
    });
};

export const useConfirmImport = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (importData: { outletId: string; data: any[] }) => {
            const response = await apiClient.post('/products/import/confirm', importData);
            return response.data.data;
        },
        onSuccess: (data) => {
            // Invalidate products for the outlet
            queryClient.invalidateQueries({ queryKey: ['products', data.outletId] });
        },
    });
};

// File operations (still using fetch for blob handling)
export const productApi = {
    bulkImport: async (outletId: string, file: File): Promise<any> => {
        const token = localStorage.getItem('authToken'); // Fallback for file operations
        const formData = new FormData();
        formData.append('file', file);
        formData.append('outletId', outletId);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1234/api/v1'}/products/bulk`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
        });
        if (!response.ok) throw new Error('Import failed');
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Import failed');
        return result.data;
    },

    exportTemplate: async (): Promise<Blob> => {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1234/api/v1'}/products/template/import`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error('Template download failed');
        return response.blob();
    },

    exportData: async (outletId: string, filters?: { type?: 'GOODS' | 'SERVICE'; search?: string }): Promise<Blob> => {
        const token = localStorage.getItem('authToken');
        const searchParams = new URLSearchParams();
        if (filters?.type) searchParams.append('type', filters.type);
        if (filters?.search) searchParams.append('search', filters.search);
        const qs = searchParams.toString();
        const endpoint = `/products/export/${outletId}${qs ? `?${qs}` : ''}`;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1234/api/v1'}${endpoint}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) {
            if (response.status === 404) throw new Error('Export endpoint not found (404)');
            throw new Error(`Export failed with status ${response.status}`);
        }
        return response.blob();
    },

    uploadImport: async (formData: FormData): Promise<any> => {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1234/api/v1'}/products/import/preview`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        });
        if (!response.ok) throw new Error('Import preview failed');
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Import preview failed');
        return result;
    },
};