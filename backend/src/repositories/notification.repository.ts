import { db } from '../config/prisma';
import { OrderStatus, PaymentStatus, ProductType } from '@prisma/client';

export type EmailTemplatePayload = {
    OwnerName: string;
    OwnerEmail: string;
    OutletName: string;
    BookingDate: string;
    BookingTime: string;
    OrderId: string;
    ServiceName: string;
    CustomerName: string;
    CustomerPhone: string;
    PaymentMethod: string;
    StaffName: string;
    TotalAmount: string;
    PaymentStatus: string;
};

export class NotificationRepository {
    static countNewOrdersToProcess(outletId: string) {
        return db.order.count({
            where: {
                outletId,
                paymentStatus: PaymentStatus.SUCCESS,
                orderStatus: { in: [OrderStatus.AWAITING_PAYMENT, OrderStatus.PROCESSING, OrderStatus.READY] },
            },
        });
    }

    static countLowStockGoods(outletId: string, threshold: number) {
        return db.productGoods.count({
            where: {
                currentStock: { lte: threshold },
                product: {
                    outletId,
                    type: ProductType.GOODS,
                },
            },
        });
    }

    static countOrdersInRange(outletId: string, start: Date, end: Date) {
        return db.order.count({
            where: {
                outletId,
                paymentStatus: PaymentStatus.SUCCESS,
                createdAt: { gte: start, lt: end },
            },
        });
    }

    static async getPayloadForServiceEmail(orderId: string): Promise<EmailTemplatePayload | null> {
        const rawResult = await db.$queryRaw<any[]>`
            SELECT 
                o.id AS "orderId",
                o."totalAmount",
                o."paymentStatus",
                gc.name AS "customerName",
                gc.phone AS "customerPhone",
                out.name AS "outletName",
                u.name AS "ownerName",
                u.email AS "ownerEmail",
                
                -- Mengambil informasi pembayaran
                t."paymentMethod",
                t."manualMethod",
                
                -- Mengambil nama kasir (jika ada)
                s.name AS "staffName",
                
                -- Menggabungkan nama layanan jika pelanggan memesan > 1 layanan sekaligus
                (
                    SELECT string_agg(p.name, ', ') 
                    FROM "OrderItem" oi 
                    JOIN "Product" p ON oi."productId" = p.id 
                    WHERE oi."orderId" = o.id
                ) AS "serviceName",
                
                -- Mengambil jadwal dari slot booking (asumsi ambil jadwal pertama)
                (
                    SELECT bs.date 
                    FROM "OrderItem" oi 
                    JOIN "BookingSlot" bs ON bs."orderItemId" = oi.id 
                    WHERE oi."orderId" = o.id 
                    LIMIT 1
                ) AS "bookingDate",
                
                -- Mengambil jam mulai booking
                (
                    SELECT bs."startTime" 
                    FROM "OrderItem" oi 
                    JOIN "BookingSlot" bs ON bs."orderItemId" = oi.id 
                    WHERE oi."orderId" = o.id 
                    LIMIT 1
                ) AS "startTime"
                
            FROM "Order" o
            JOIN "GuestCustomer" gc ON o."guestCustomerId" = gc.id
            JOIN "Outlet" out ON o."outletId" = out.id
            JOIN "Business" b ON out."businessId" = b.id
            JOIN "User" u ON b."ownerId" = u.id
            LEFT JOIN "Transaction" t ON t."orderId" = o.id
            LEFT JOIN "Staff" s ON o."handledByStaffId" = s.id
            WHERE o.id = ${orderId}
        `;

        const data = rawResult[0];

        if (!data) return null; // Order tidak ditemukan

        // --- FORMATTING DATA ---

        // 1. Format Tanggal (Contoh: 12 Maret 2026)
        let formattedDate = "-";
        if (data.bookingDate) {
            const dateObj = new Date(data.bookingDate);
            formattedDate = new Intl.DateTimeFormat('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }).format(dateObj);
        }

        // 2. Format Jam (Contoh: 14:00)
        let formattedTime = "-";
        if (data.startTime) {
            const timeObj = new Date(data.startTime);
            formattedTime = new Intl.DateTimeFormat('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Jakarta' // Sesuaikan jika ada timezone khusus
            }).format(timeObj).replace('.', ':') + ' WIB';
        }

        // 3. Format Uang (Contoh: 150.000)
        const formattedAmount = new Intl.NumberFormat('id-ID').format(Number(data.totalAmount || 0));

        // 4. Format Status Pembayaran
        const statusMap: Record<string, string> = {
            'SUCCESS': 'Lunas (SUCCESS)',
            'PENDING': 'Menunggu Pembayaran (PENDING)',
            'PROOF_SUBMITTED': 'Menunggu Verifikasi Manual',
            'AWAITING_VERIFICATION': 'Menunggu Verifikasi'
        };
        const displayStatus = statusMap[data.paymentStatus] || data.paymentStatus;

        // 5. Format Metode Pembayaran (Mengutamakan paymentMethod, fallback ke manualMethod)
        const rawPaymentMethod = data.paymentMethod || data.manualMethod || '-';
        const displayPaymentMethod = rawPaymentMethod.replace(/_/g, ' ').toUpperCase();

        // 6. Nama Kasir
        const displayStaffName = data.staffName || 'Online (Mandiri)';

        return {
            OwnerName: data.ownerName || 'Owner',
            OwnerEmail: data.ownerEmail,
            OutletName: data.outletName || '-',
            BookingDate: formattedDate,
            BookingTime: formattedTime,
            OrderId: data.orderId,
            ServiceName: data.serviceName || '-',
            CustomerName: data.customerName || 'Pelanggan',
            CustomerPhone: data.customerPhone || '-',
            PaymentMethod: displayPaymentMethod,
            StaffName: displayStaffName,
            TotalAmount: formattedAmount,
            PaymentStatus: displayStatus
        };
    }
}