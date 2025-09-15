// API utility functions for BOSS Dashboard

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1234/api/v1';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Create headers with auth token
const createHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Generic API call function
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...createHeaders(),
      ...options.headers,
    },
  });

  // Try to parse JSON body for success or error messages
  const text = await response.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch (e) {
    // ignore JSON parse errors
  }

  if (!response.ok) {
    // Prefer backend-provided message if available
    const backendMessage = parsed?.message || parsed?.data?.message || parsed?.error || parsed?.errors || null;
    const message = backendMessage ? (typeof backendMessage === 'string' ? backendMessage : JSON.stringify(backendMessage)) : `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  const result: ApiResponse<T> = parsed as ApiResponse<T>;
  if (!result) {
    throw new Error('Invalid API response');
  }

  if (!result.success) {
    throw new Error(result.message || 'API call failed');
  }

  return result.data;
}

// Auth API functions
export const authApi = {
  me: () => apiCall<{
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
    business: {
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
    };
    outlets: Array<{
      id: string;
      name: string;
      address: string;
      phone?: string;
      imageUrl?: string;
      latitude?: number;
      longitude?: number;
    }>;
  }>('/auth/me'),
};

// Business API functions
export const businessApi = {
  getDashboard: (businessId: string) => apiCall<{
    totalRevenue: number;
    totalOrders: number;
    totalExpenses: number;
    totalProducts: number;
    totalServices: number;
    dailyRevenue: number;
    topProducts: Array<{
      productId: string;
      name: string;
      quantity: number;
      revenue: number;
    }>;
  }>(`/dashboard/business/${businessId}`),
  
  // fetch my business
  getMyBusiness: () => apiCall<any>(`/business/my/business`),
  
  // update basic fields of a business
  updateBusiness: (businessId: string, data: Partial<{ name: string; description?: string; type?: string; address?: string; phone?: string }>) =>
    apiCall<any>(`/business/${businessId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  // create business minimal payload (backend create requires bank fields, but we support minimal and backend will validate)
  createBusiness: (data: { name: string; description?: string; bankName?: string; bankAccount?: string; accountHolder?: string; defaultTransactionFeeBearer?: 'CUSTOMER' | 'OWNER' }) =>
    apiCall<any>(`/business`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateBankAccount: (businessId: string, bankData: {
    bankName: string;
    bankAccount: string;
    accountHolder: string;
  }) => apiCall<any>(`/business/${businessId}/bank-account`, {
    method: 'PUT',
    body: JSON.stringify(bankData),
  }),

  createOutlet: (outletData: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    description?: string;
    openingHours?: string;
    status: 'ACTIVE' | 'INACTIVE';
  }) => apiCall<any>('/outlets', {
    method: 'POST',
    body: JSON.stringify(outletData),
  }),
};

// Outlet API functions
export const outletApi = {
  getByBusiness: (businessId: string, params?: {
    take?: number;
    limit?: number;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.take) searchParams.append('take', params.take.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    
    const queryString = searchParams.toString();
    const endpoint = `/outlets/business/${businessId}${queryString ? `?${queryString}` : ''}`;
    
    return apiCall<Array<{
      id: string;
      name: string;
      address: string;
      phone?: string;
      imageUrl?: string;
      latitude?: number;
      longitude?: number;
    }>>(endpoint);
  },

  getDashboard: (outletId: string) => apiCall<{
    totalSales: number;
    totalOrders: number;
    totalExpenses: number;
    profit: number;
    topProducts: Array<{
      productId: string;
      name: string;
      quantity: number;
      revenue: number;
    }>;
  }>(`/dashboard/outlet/${outletId}`),

  getDailyReport: (outletId: string, date?: string) => {
    const endpoint = `/reports/daily/${outletId}${date ? `?date=${date}` : ''}`;
    return apiCall<{
      totalSales: number;
      totalOrders: number;
      totalExpenses: number;
      profit: number;
      topProducts: Array<{
        productId: string;
        name: string;
        quantity: number;
        revenue: number;
      }>;
    }>(endpoint);
  },
};

// Product API functions
export const productApi = {
  getByOutlet: (outletId: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('q', params.search);
    
    const queryString = searchParams.toString();
    const endpoint = `/products/outlet/${outletId}${queryString ? `?${queryString}` : ''}`;
    
    return apiCall<{
      products: Array<{
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
        createdAt: string;
        updatedAt: string;
      }>;
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(endpoint);
  },

  getById: (productId: string) => apiCall<{
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
    outletId: string;
    createdAt: string;
    updatedAt: string;
  }>(`/products/${productId}`),

  create: (productData: {
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
  }) => apiCall<any>('/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  }),

  update: (productId: string, productData: Partial<{
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
  }>) => apiCall<any>(`/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(productData),
  }),

  delete: (productId: string) => apiCall<any>(`/products/${productId}`, {
    method: 'DELETE',
  }),

  search: (query: string) => apiCall<Array<{
    id: string;
    name: string;
    description?: string;
    costPrice: number;
    price: number;
    type: 'GOODS' | 'SERVICE';
    quantity?: number;
    unit?: string;
    status: 'ACTIVE' | 'INACTIVE';
    image?: string;
  }>>(`/products/search?name=${encodeURIComponent(query)}`),

  bulkImport: async (outletId: string, file: File): Promise<any> => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('outletId', outletId);

    const response = await fetch(`${API_BASE_URL}/products/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Import failed');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Import failed');
    }

    return result.data;
  },

  exportTemplate: async (): Promise<Blob> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/products/template/import`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Template download failed');
    }
    
    return response.blob();
  },

  exportData: async (outletId: string, filters?: {
    type?: 'GOODS' | 'SERVICE';
    search?: string;
  }): Promise<Blob> => {
    const token = getAuthToken();
    const searchParams = new URLSearchParams();
    
    if (filters?.type) searchParams.append('type', filters.type);
    if (filters?.search) searchParams.append('search', filters.search);
    
    const queryString = searchParams.toString();
    const endpoint = `/products/export/${outletId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Export endpoint not found (404)');
      }
      throw new Error(`Export failed with status ${response.status}`);
    }
    
    return response.blob();
  },

  uploadImport: async (formData: FormData): Promise<any> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/products/import/preview`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Import preview failed');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Import preview failed');
    }

    return result;
  },

  confirmImport: (importData: {
    outletId: string;
    data: any[];
  }) => apiCall<any>('/products/import/confirm', {
    method: 'POST',
    body: JSON.stringify(importData),
  }),

  updateStock: (productId: string, stockData: {
    type: 'adjustment' | 'add' | 'subtract';
    quantity: number;
    reason: string;
    notes?: string;
  }) => apiCall<any>(`/products/${productId}/stock`, {
    method: 'PATCH',
    body: JSON.stringify(stockData),
  })
};

// Stock API functions
export const stockApi = {
  getByOutlet: (outletId: string, params?: {
    search?: string;
    type?: 'GOODS' | 'SERVICE';
    status?: 'ACTIVE' | 'INACTIVE';
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('q', params.search);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.status) searchParams.append('status', params.status);
    
    const queryString = searchParams.toString();
    const endpoint = `/products/outlet/${outletId}${queryString ? `?${queryString}` : ''}`;
    
    return apiCall<Array<{
      id: string;
      name: string;
      type: 'GOODS' | 'SERVICE';
      quantity?: number;
      unit?: string;
      price: number;
      status: 'ACTIVE' | 'INACTIVE';
      image?: string;
    }>>(endpoint);
  },

  updateStock: (productId: string, stockData: {
    quantity: number;
    adjustment?: 'add' | 'remove' | 'set';
    adjustmentQuantity?: number;
    reason?: string;
    notes?: string;
  }) => apiCall<any>(`/products/${productId}/stock`, {
    method: 'PATCH',
    body: JSON.stringify(stockData),
  }),
};

// Order API functions
export const orderApi = {
  getByOutlet: (outletId: string, params?: {
    status?: string;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const queryString = searchParams.toString();
    const endpoint = `/orders/${outletId}/goods${queryString ? `?${queryString}` : ''}`;
    
    return apiCall<Array<{
      id: string;
      customerName: string;
      customerPhone: string;
      status: string;
      totalAmount: number;
      createdAt: string;
      items: Array<{
        productId: string;
        quantity: number;
        price: number;
        notes?: string;
      }>;
    }>>(endpoint);
  },

  getQueue: (outletId: string) => apiCall<Array<{
    id: string;
    customerName: string;
    queueNumber: number;
    status: string;
    estimatedTime?: number;
    createdAt: string;
  }>>(`/orders/${outletId}/queue`),
};

// Expense API functions
export const expenseApi = {
  getByOutlet: (outletId: string, params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    
    const queryString = searchParams.toString();
    const endpoint = `/expenses/outlet/${outletId}${queryString ? `?${queryString}` : ''}`;
    
    return apiCall<Array<{
      id: string;
      description: string;
      amount: number;
      category: string;
      date: string;
      createdAt: string;
    }>>(endpoint);
  },

  create: (expenseData: {
    description: string;
    amount: number;
    category: string;
    outletId: string;
    date: string;
  }) => apiCall<any>('/expenses', {
    method: 'POST',
    body: JSON.stringify(expenseData),
  }),
};

// Withdrawal API functions
export const withdrawalApi = {
  getCalculation: (businessId: string) => apiCall<{
    availableAmount: number;
    pendingAmount: number;
    totalRevenue: number;
    totalExpenses: number;
    minWithdrawal: number;
  }>(`/withdrawals/business/${businessId}/calculation`),

  request: (businessId: string, withdrawalData: {
    amount: number;
    bankAccount: {
      bankName: string;
      accountNumber: string;
      accountHolderName: string;
    };
    notes?: string;
  }) => apiCall<any>(`/withdrawals/business/${businessId}/request`, {
    method: 'POST',
    body: JSON.stringify(withdrawalData),
  }),

  getHistory: (businessId: string, params?: {
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    
    const queryString = searchParams.toString();
    const endpoint = `/withdrawals/business/${businessId}/history${queryString ? `?${queryString}` : ''}`;
    
    return apiCall<Array<{
      id: string;
      amount: number;
      status: string;
      bankAccount: {
        bankName: string;
        accountNumber: string;
        accountHolderName: string;
      };
      notes?: string;
      requestedAt: string;
      processedAt?: string;
    }>>(endpoint);
  },
};

// Dashboard API functions with new endpoints
export const dashboardApi = {
  getSummary: (outletId: string) => apiCall<{
    totalProducts: number;
    totalServices: number;
    totalOrders: number;
    totalRevenue: number;
  }>(`/dashboard/summary?outletId=${outletId}`),
  
  getOrderStats: (outletId: string, period: 'week' | 'month' = 'month') => apiCall<Record<string, {
    totalOrders: number;
    totalRevenue: number;
  }>>(`/dashboard/stats?outletId=${outletId}&period=${period}`),
  
  exportData: async (outletId: string, type: 'orders' | 'products' | 'reports', format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/reports/export?outletId=${outletId}&type=${type}&format=${format}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    return response.blob();
  }
};

// Add outlet management functions
export const outletManagementApi = {
  create: (outletData: {
    name: string;
    address: string;
    phone: string;
    businessId: string;
    latitude?: number;
    longitude?: number;
    image?: string;
    // optional extras for future compatibility; backend may ignore unknown fields
    email?: string;
    description?: string;
    openingHours?: string;
    status?: 'ACTIVE' | 'INACTIVE';
  }) => apiCall<{
    id: string;
    name: string;
    address: string;
    phone: string;
    imageUrl?: string;
    latitude?: number;
    longitude?: number;
  }>('/outlets', {
    method: 'POST',
    body: JSON.stringify(outletData),
  }),
  
  update: (outletId: string, outletData: Partial<{
    name: string;
    address: string;
    phone: string;
    latitude: number;
    longitude: number;
    image: string;
  }>) => apiCall<any>(`/outlets/${outletId}`, {
    method: 'PATCH',
    body: JSON.stringify(outletData),
  }),
  
  delete: (outletId: string) => apiCall<any>(`/outlets/${outletId}`, {
    method: 'DELETE',
  }),
};
