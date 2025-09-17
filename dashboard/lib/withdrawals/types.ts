// Types and interfaces for withdrawal management system
export type WithdrawalStatus = 'PENDING' | 'COMPLETED' | 'REJECTED' | 'PROCESSING';

export interface Withdrawal {
    id: string;
    requestedAmount: number;
    finalAmount?: number;
    status: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'PROCESSING';
    notes?: string;
    adminNotes?: string;
    createdAt: string;
    updatedAt?: string;
    processedAt?: string;
    business: {
        id: string;
        name: string;
        email?: string;
        phone?: string;
        owner: {
            name: string;
            email: string;
        };
    };
    processedBy?: {
        name: string;
        email: string;
    };
}

export interface WithdrawalStats {
    summary: {
        totalWithdrawals: number;
        pendingWithdrawals: number;
        completedWithdrawals: number;
        rejectedWithdrawals: number;
        totalAmount: number;
        pendingAmount: number;
        completedAmount: number;
    };
    recentWithdrawals?: Withdrawal[];
}

export interface WithdrawalFilters {
    status?: string;
    businessId?: string;
    businessName?: string;
    minAmount?: number;
    maxAmount?: number;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export interface WithdrawalPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface WithdrawalListResponse {
    withdrawals: Withdrawal[];
    pagination: WithdrawalPagination;
}

export interface ProcessWithdrawalRequest {
    action: 'APPROVE' | 'REJECT';
    notes?: string;
}

export interface BulkProcessWithdrawalRequest {
    withdrawalIds: string[];
    action: 'APPROVE' | 'REJECT';
    notes?: string;
}

export interface BulkProcessWithdrawalResponse {
    message: string;
    results: Withdrawal[];
    errors?: Array<{
        withdrawalId: string;
        error: string;
    }>;
}

// Status types for UI components
// export type WithdrawalStatus = Withdrawal['status'];

export interface WithdrawalTableColumn {
    key: keyof Withdrawal;
    label: string;
    sortable?: boolean;
    render?: (value: any, withdrawal: Withdrawal) => React.ReactNode;
}

// Form types
export interface WithdrawalProcessForm {
    notes: string;
}

export interface WithdrawalBulkProcessForm {
    notes: string;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface ApiError {
    success: false;
    message: string;
    errors?: Record<string, string[]>;
}