import { db } from '../config/prisma';
import { AppError } from '../errors/app-error';
import { HttpStatus } from '../constants/http-status';
import { getOutletByIdService } from './outlet.service';
import { getBusinessByIdService } from './business.service';
import { NotificationRepository } from '../repositories/notification.repository';

export type NotificationItem =
    | { type: 'NEW_ORDERS'; title: string; message: string; count: number; time: Date }
    | { type: 'LOW_STOCK'; title: string; message: string; count: number; threshold: number; time: Date }
    | { type: 'WEEKLY_REPORT'; title: string; message: string; time: Date };

export async function getLatestNotificationsService(params: { outletId: string; ownerId: string; lowStockThreshold?: number }) {
    const { outletId, ownerId } = params;
    const threshold = Math.max(0, params.lowStockThreshold ?? 5);

    // Validate ownership
    const outlet = await getOutletByIdService(outletId);
    const business = await getBusinessByIdService(outlet.businessId);
    if (business.ownerId !== ownerId) {
        throw new AppError('Anda tidak berhak mengakses outlet ini.', HttpStatus.FORBIDDEN);
    }

    // Parallel queries
    const now = new Date();

    // Calculate last week's range (Mon 00:00 to next Mon 00:00)
    const end = new Date(now);
    const day = end.getDay();
    const diffToMonday = (day + 6) % 7;
    const start = new Date(end);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - diffToMonday - 7);
    const weekEnd = new Date(start);
    weekEnd.setDate(start.getDate() + 7);

    const [newOrdersCount, lowStockCount, lastWeekOrdersCount] = await db.$transaction([
        NotificationRepository.countNewOrdersToProcess(outletId),
        NotificationRepository.countLowStockGoods(outletId, threshold),
        NotificationRepository.countOrdersInRange(outletId, start, weekEnd),
    ]);

    const items: NotificationItem[] = [];

    items.push({
        type: 'NEW_ORDERS',
        title: 'Pesanan Baru',
        message: `Anda memiliki ${newOrdersCount} pesanan baru yang perlu diproses`,
        count: newOrdersCount,
        time: now,
    });

    items.push({
        type: 'LOW_STOCK',
        title: 'Stok Rendah',
        message: lowStockCount > 0
            ? `Ada ${lowStockCount} produk memiliki stok di bawah batas minimum`
            : 'Tidak ada produk yang stoknya rendah',
        count: lowStockCount,
        threshold,
        time: now,
    });

    items.push({
        type: 'WEEKLY_REPORT',
        title: 'Laporan Mingguan',
        message: lastWeekOrdersCount > 0
            ? 'Laporan penjualan minggu ini sudah tersedia'
            : 'Belum ada transaksi untuk laporan mingguan',
        time: now,
    });

    return {
        outletId,
        generatedAt: now,
        items,
    };
}
