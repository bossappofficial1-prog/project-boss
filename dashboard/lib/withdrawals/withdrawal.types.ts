// withdrawal.types.ts

export interface Withdrawal {
    id: string;
    requestedAmount: number;
    finalAmount?: number;
    status: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'PROCESSING';
    notes?: string;
    adminNotes?: string;
    createdAt: string;
    processedAt?: string;
    business: {
        id: string;
        name: string;
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
    recentWithdrawals: Withdrawal[];
}
