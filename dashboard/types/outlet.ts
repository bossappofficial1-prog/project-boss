// === OUTLET INFO ===
export interface OutletInfo {
    id: string;
    name: string;
    address: string;
    phone?: string;
    imageUrl?: string;
    description?: string;
    isOpen: boolean;
    latitude?: number;
    longitude?: number;
    staffCount: number;

    // Manual Payment Fields
    manualBankName?: string;
    manualBankAccount?: string;
    manualAccountHolder?: string;
    manualPaymentNote?: string;
    manualQrImageUrl?: string;

    operatingHours?: {
        dayOfWeek: number;
        openTime: string;
        closeTime: string;
        isOpen: boolean;
    }[];
}

// === REVENUE METRICS ===
export interface RevenueMetrics {
    totalRevenue: number;
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;

    byPaymentMethod: {
        method: string;
        amount: number;
        percentage: number;
    }[];

    dailyTrend: {
        date: string;
        revenue: number;
        orders: number;
    }[];
}

// === PRODUCT METRICS ===
export interface ProductMetrics {
    totalProducts: number;
    activeProducts: number;

    byType: {
        type: 'GOODS' | 'SERVICE';
        count: number;
        percentage: number;
    }[];

    topProducts: {
        id: string;
        name: string;
        quantity: number;
        revenue: number;
        type: 'GOODS' | 'SERVICE';
    }[];

    lowStockProducts: {
        id: string;
        name: string;
        currentStock: number;
        reorderLevel: number;
    }[];
}

// === ORDER METRICS ===
export interface OrderMetrics {
    totalOrders: number;
    todayOrders: number;
    weekOrders: number;
    monthOrders: number;

    byStatus: {
        status: string;
        count: number;
        percentage: number;
    }[];

    averageOrderValue: number;
    completionRate: number;

    orderTrend: {
        date: string;
        completed: number;
        cancelled: number;
        pending: number;
    }[];
}

// === PAYMENT METRICS ===
export interface PaymentMetrics {
    totalTransactions: number;
    successCount: number;
    failedCount: number;
    pendingCount: number;

    successRate: number;

    byStatus: {
        status: string;
        count: number;
        amount: number;
    }[];

    byPaymentMethod: {
        method: string;
        count: number;
        amount: number;
        percentage: number;
    }[];

    manualPayments: {
        totalManual: number;
        pending: number;
        verified: number;
        rejected: number;
    };
}

// === BOOKING METRICS ===
export interface BookingMetrics {
    totalSlots: number;
    bookedSlots: number;
    availableSlots: number;
    occupancyRate: number;

    byStaff: {
        staffId: string;
        staffName: string;
        bookingCount: number;
        utilization: number;
    }[];

    upcomingBookings: {
        id: string;
        customerName: string;
        serviceName: string;
        startTime: string;
        staffName?: string;
    }[];
}

// === EXPENSE METRICS ===
export interface ExpenseMetrics {
    totalExpenses: number;
    todayExpenses: number;
    weekExpenses: number;
    monthExpenses: number;

    expenseVsRevenue: {
        revenue: number;
        expenses: number;
        netProfit: number;
        profitMargin: number;
    };

    recentExpenses: {
        id: string;
        description: string;
        amount: number;
        date: string;
    }[];

    dailyTotals: {
        date: string;
        expenses: number;
    }[];
}

// === OUTLET ANALYTICS RESPONSE ===
export interface PaymentMethodBreakdown {
    method: string;
    amount: number;
    count: number;
    percentage: number;
}

export interface RevenueAnalytics {
    totalRevenue: number;
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    lastMonthRevenue: number;
    lastMonthAverage: number;
    monthOverMonthGrowth: number | null;
    lastMonthDaily: {
        date: string;
        amount: number;
    }[];
    byPaymentMethod: PaymentMethodBreakdown[];
    dailyTrend: {
        date: string;
        revenue: number;
        orders: number;
    }[];
}

export interface ProductTypeAnalytics {
    type: 'GOODS' | 'SERVICE';
    count: number;
    percentage: number;
}

export interface TopProductAnalytics {
    id: string;
    name: string;
    quantity: number;
    revenue: number;
    type: 'GOODS' | 'SERVICE';
}

export interface LowStockProductAnalytics {
    id: string;
    name: string;
    currentStock: number;
    reorderLevel: number;
}

export interface ProductAnalytics {
    byType: ProductTypeAnalytics[];
    topProducts: TopProductAnalytics[];
    lowStock: LowStockProductAnalytics[];
}

export interface ExpenseVsRevenueEntry {
    date: string;
    revenue: number;
    expenses: number;
}

export interface OutletAnalyticsResponse {
    revenue: RevenueAnalytics;
    paymentMethods: PaymentMethodBreakdown[];
    payments: PaymentMetrics;
    products: ProductAnalytics;
    orders: OrderMetrics;
    expenses: ExpenseMetrics;
    expenseVsRevenueData: ExpenseVsRevenueEntry[];
}

// === OUTLET DASHBOARD DATA ===
export interface OutletDashboardData {
    outletInfo: OutletInfo;
    revenue: RevenueMetrics;
    products: ProductMetrics;
    orders: OrderMetrics;
    payments: PaymentMetrics;
    bookings: BookingMetrics;
    expenses: ExpenseMetrics;
}

// === TIMEFRAME FILTER ===
export type TimeframeFilter = '7d' | '30d' | '3m' | 'custom';

export interface TimeframeRange {
    startDate: Date;
    endDate: Date;
    label: string;
}

export interface OutletRevenueTrendResponse {
    timeframe: TimeframeFilter;
    range: {
        startDate: string;
        endDate: string;
    };
    totals: {
        revenue: number;
        orders: number;
        averageRevenue: number;
        maxRevenue: number;
    };
    data: Array<{
        date: string;
        revenue: number;
        orders: number;
    }>;
}
