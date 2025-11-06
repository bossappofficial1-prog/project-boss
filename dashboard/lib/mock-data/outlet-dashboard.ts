import { OutletDashboardData } from '@/types/outlet';

export const mockOutletDashboard: OutletDashboardData = {
    outletInfo: {
        id: 'outlet_123',
        name: 'Outlet Jaya Coffee',
        address: 'Jl. Merdeka No. 123, Jakarta Pusat, 12345',
        phone: '+62812-3456-7890',
        imageUrl: '/outlet-image.jpg',
        description: 'Kedai kopi premium dengan suasana nyaman',
        isOpen: true,
        staffCount: 5,
        manualBankName: 'BCA',
        manualBankAccount: '123-456-7890',
        manualAccountHolder: 'Nama Pemilik',
        manualPaymentNote: 'Konfirmasi transfer via WhatsApp',
        manualQrImageUrl: '/qris-code.png',
        latitude: -6.2088,
        longitude: 106.8456,
    },

    revenue: {
        totalRevenue: 52500000,
        todayRevenue: 3750000,
        weekRevenue: 25000000,
        monthRevenue: 52500000,

        byPaymentMethod: [
            { method: 'QRIS', amount: 34125000, percentage: 65 },
            { method: 'Transfer', amount: 15750000, percentage: 30 },
            { method: 'Tunai/Manual', amount: 2625000, percentage: 5 },
        ],

        dailyTrend: [
            { date: '2025-10-24', revenue: 2500000, orders: 35 },
            { date: '2025-10-25', revenue: 3000000, orders: 42 },
            { date: '2025-10-26', revenue: 2800000, orders: 39 },
            { date: '2025-10-27', revenue: 3500000, orders: 48 },
            { date: '2025-10-28', revenue: 3200000, orders: 44 },
            { date: '2025-10-29', revenue: 4000000, orders: 55 },
            { date: '2025-10-30', revenue: 37500000, orders: 50 },
        ],
    },

    products: {
        totalProducts: 65,
        activeProducts: 60,

        byType: [
            { type: 'GOODS', count: 45, percentage: 75 },
            { type: 'SERVICE', count: 15, percentage: 25 },
        ],

        topProducts: [
            { id: 'prod_1', name: 'Kopi Espresso', quantity: 250, revenue: 3750000, type: 'GOODS' },
            { id: 'prod_2', name: 'Cappuccino', quantity: 180, revenue: 3600000, type: 'GOODS' },
            { id: 'prod_3', name: 'Latte Art', quantity: 160, revenue: 3200000, type: 'GOODS' },
            { id: 'prod_4', name: 'Makeup Session', quantity: 45, revenue: 2700000, type: 'SERVICE' },
            { id: 'prod_5', name: 'Americano', quantity: 140, revenue: 2100000, type: 'GOODS' },
        ],

        lowStockProducts: [
            { id: 'prod_6', name: 'Kopi Arabika Premium', currentStock: 5, reorderLevel: 20 },
            { id: 'prod_7', name: 'Susu Murni', currentStock: 8, reorderLevel: 30 },
            { id: 'prod_8', name: 'Gula Cair', currentStock: 3, reorderLevel: 15 },
        ],
    },

    orders: {
        totalOrders: 1250,
        todayOrders: 50,
        weekOrders: 350,
        monthOrders: 480,

        byStatus: [
            { status: 'COMPLETED', count: 1100, percentage: 88 },
            { status: 'PROCESSING', count: 80, percentage: 6.4 },
            { status: 'AWAITING_PAYMENT', count: 50, percentage: 4 },
            { status: 'CANCELLED', count: 20, percentage: 1.6 },
        ],

        averageOrderValue: 42000,
        completionRate: 88,

        orderTrend: [
            { date: '2025-10-24', completed: 32, cancelled: 2, pending: 1 },
            { date: '2025-10-25', completed: 38, cancelled: 3, pending: 1 },
            { date: '2025-10-26', completed: 35, cancelled: 2, pending: 2 },
            { date: '2025-10-27', completed: 42, cancelled: 4, pending: 2 },
            { date: '2025-10-28', completed: 40, cancelled: 2, pending: 2 },
            { date: '2025-10-29', completed: 50, cancelled: 3, pending: 2 },
            { date: '2025-10-30', completed: 48, cancelled: 1, pending: 1 },
        ],
    },

    payments: {
        totalTransactions: 1200,
        successCount: 1080,
        failedCount: 60,
        pendingCount: 60,
        successRate: 90,

        byStatus: [
            { status: 'SUCCESS', count: 1080, amount: 45360000 },
            { status: 'PENDING', count: 60, amount: 2520000 },
            { status: 'FAILED', count: 60, amount: 2520000 },
        ],

        byPaymentMethod: [
            { method: 'QRIS', count: 720, amount: 30240000, percentage: 60 },
            { method: 'Transfer', count: 360, amount: 15120000, percentage: 30 },
            { method: 'Manual', count: 120, amount: 5040000, percentage: 10 },
        ],

        manualPayments: {
            totalManual: 120,
            pending: 8,
            verified: 110,
            rejected: 2,
        },
    },

    bookings: {
        totalSlots: 100,
        bookedSlots: 75,
        availableSlots: 25,
        occupancyRate: 75,

        byStaff: [
            { staffId: 'staff_1', staffName: 'Budi Santoso', bookingCount: 25, utilization: 83 },
            { staffId: 'staff_2', staffName: 'Siti Nurhaliza', bookingCount: 23, utilization: 77 },
            { staffId: 'staff_3', staffName: 'Ahmad Wijaya', bookingCount: 18, utilization: 60 },
            { staffId: 'staff_4', staffName: 'Rini Handoko', bookingCount: 9, utilization: 30 },
        ],

        upcomingBookings: [
            {
                id: 'book_1',
                customerName: 'Andi Wijaya',
                serviceName: 'Makeup Session',
                startTime: '2025-10-30 14:00',
                staffName: 'Budi Santoso',
            },
            {
                id: 'book_2',
                customerName: 'Nina Salsabila',
                serviceName: 'Hair Treatment',
                startTime: '2025-10-30 15:30',
                staffName: 'Siti Nurhaliza',
            },
            {
                id: 'book_3',
                customerName: 'Reza Pratama',
                serviceName: 'Barbering',
                startTime: '2025-10-30 16:00',
                staffName: 'Ahmad Wijaya',
            },
        ],
    },

    expenses: {
        totalExpenses: 12600000,
        todayExpenses: 900000,
        weekExpenses: 6000000,
        monthExpenses: 12600000,

        expenseVsRevenue: {
            revenue: 52500000,
            expenses: 12600000,
            netProfit: 39900000,
            profitMargin: 76,
        },

        recentExpenses: [
            { id: 'exp_1', description: 'Pembelian Kopi Arabika', amount: 1500000, date: '2025-10-30' },
            { id: 'exp_2', description: 'Biaya Listrik dan Air', amount: 2000000, date: '2025-10-29' },
            { id: 'exp_3', description: 'Gaji Staff (bulan Oktober)', amount: 5000000, date: '2025-10-28' },
            { id: 'exp_4', description: 'Pemeliharaan Mesin Kopi', amount: 1500000, date: '2025-10-27' },
            { id: 'exp_5', description: 'Pembelian Supplies', amount: 800000, date: '2025-10-26' },
        ],

        dailyTotals: [
            { date: '2025-10-24', expenses: 420000 },
            { date: '2025-10-25', expenses: 560000 },
            { date: '2025-10-26', expenses: 480000 },
            { date: '2025-10-27', expenses: 640000 },
            { date: '2025-10-28', expenses: 520000 },
            { date: '2025-10-29', expenses: 610000 },
            { date: '2025-10-30', expenses: 700000 },
        ],
    },
};
