import { OrderStatus } from "@prisma/client";
import { QueueV2Repository } from "../repositories/queue-v2.repository";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { getOutletByIdService } from "./outlet.service";
import { getBusinessByIdService } from "./business.service";
import { updateServiceQueueStatusService } from "./order.service";

interface QueueEntryItem {
    id: string;
    productId: string;
    productName: string;
    productType: "SERVICE" | "GOODS";
    quantity: number;
    price: number;
    duration: number | null;
}

interface QueueEntry {
    id: string;
    orderStatus: OrderStatus;
    totalAmount: number;
    customerName: string;
    customerPhone: string | null;
    productName: string;
    productDuration: number | null;
    items: QueueEntryItem[];
    goodsCount: number;
    staffName: string | null;
    scheduledStart: string | null;
    scheduledEnd: string | null;
    position: number;
    createdAt: string;
    updatedAt: string;
    bookingSlot: {
        id: string;
        startTime: string | null;
        endTime: string | null;
        status: string;
    } | null;
    paymentMethod: string | null;
    isManualPayment: boolean;
    paymentProofUrl: string | null;
    paymentStatus: string | null;
    cancellationReason: string | null;
}

interface QueueBoard {
    waiting: QueueEntry[];
    ready: QueueEntry[];
    inProgress: QueueEntry[];
    completed: QueueEntry[];
}

interface QueueStats {
    totalActive: number;
    waitingCount: number;
    readyCount: number;
    inProgressCount: number;
    completedToday: number;
    cancelledToday: number;
    avgWaitMinutes: number | null;
}

const WAITING_STATUSES: OrderStatus[] = [
    OrderStatus.AWAITING_PAYMENT,
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
];

function computeSchedule(order: any): { start: Date | null; end: Date | null } {
    const bookingSlot = order.items?.find((item: any) => item.bookingSlot)?.bookingSlot;
    const slotStart = bookingSlot?.startTime ? new Date(bookingSlot.startTime) : null;
    const slotEnd = bookingSlot?.endTime ? new Date(bookingSlot.endTime) : null;
    const bookingDate = order.bookingDate ? new Date(order.bookingDate) : null;
    const baseStart = slotStart ?? bookingDate ?? new Date(order.createdAt);

    if (!slotEnd) {
        const durationMinutes =
            order.items?.find((item: any) => item.product?.type === "SERVICE")?.product?.service
                ?.durationMinutes ?? 60;
        const derivedEnd = new Date(baseStart);
        derivedEnd.setMinutes(derivedEnd.getMinutes() + durationMinutes);
        return { start: baseStart, end: derivedEnd };
    }

    return { start: baseStart, end: new Date(slotEnd) };
}

function mapOrderToEntry(order: any, position: number): QueueEntry {
    const schedule = computeSchedule(order);
    const serviceItem = order.items?.find((item: any) => item.product?.type === "SERVICE");
    const bookingSlot = order.items?.find((item: any) => item.bookingSlot)?.bookingSlot ?? null;

    const allItems: QueueEntryItem[] = (order.items ?? []).map((item: any) => ({
        id: item.id,
        productId: item.productId ?? "",
        productName: item.product?.name ?? "Produk",
        productType: item.product?.type ?? "GOODS",
        quantity: item.quantity ?? 1,
        price: Number(item.priceAtTimeOfOrder ?? 0),
        duration: item.product?.type === "SERVICE"
            ? (item.product?.service?.durationMinutes ?? null)
            : null,
    }));

    const goodsItems = allItems.filter((i) => i.productType === "GOODS");

    return {
        id: order.id,
        orderStatus: order.orderStatus,
        totalAmount: Number(order.totalAmount),
        customerName: order.guestCustomer?.name ?? "Customer",
        customerPhone: order.guestCustomer?.phone ?? null,
        productName: serviceItem?.product?.name ?? "Layanan",
        productDuration: serviceItem?.product?.service?.durationMinutes ?? null,
        items: allItems,
        goodsCount: goodsItems.reduce((sum, i) => sum + i.quantity, 0),
        staffName: order.handledByStaff?.name ?? null,
        scheduledStart: schedule.start?.toISOString() ?? null,
        scheduledEnd: schedule.end?.toISOString() ?? null,
        position,
        createdAt: order.createdAt?.toISOString?.() ?? order.createdAt,
        updatedAt: order.updatedAt?.toISOString?.() ?? order.updatedAt,
        bookingSlot: bookingSlot
            ? {
                id: bookingSlot.id,
                startTime: bookingSlot.startTime?.toISOString?.() ?? bookingSlot.startTime,
                endTime: bookingSlot.endTime?.toISOString?.() ?? bookingSlot.endTime,
                status: bookingSlot.status,
            }
            : null,
        paymentMethod: order.transaction?.paymentMethod ?? null,
        isManualPayment: Boolean(order.transaction?.isManual),
        paymentProofUrl: order.transaction?.paymentProofUrl ?? null,
        paymentStatus: order.transaction?.status ?? null,
        cancellationReason: order.cancellationReason ?? null,
    };
}

async function validateOutletAccess(
    outletId: string,
    userIdentifier: string,
    validateAsOwner: boolean,
) {
    if (validateAsOwner) {
        const outlet = await getOutletByIdService(outletId);
        const business = await getBusinessByIdService(outlet.businessId);
        if (business.ownerId !== userIdentifier) {
            throw new AppError("Anda tidak berhak mengakses outlet ini.", HttpStatus.FORBIDDEN);
        }
    } else {
        if (userIdentifier !== outletId) {
            throw new AppError(
                "Anda hanya bisa mengakses antrian outlet Anda sendiri.",
                HttpStatus.FORBIDDEN,
            );
        }
    }
}

export class QueueV2Service {
    static async getBoard(
        outletId: string,
        userIdentifier: string,
        validateAsOwner = true,
        q?: string
    ): Promise<{ board: QueueBoard; stats: QueueStats }> {
        await validateOutletAccess(outletId, userIdentifier, validateAsOwner);

        const [activeOrders, completedOrders, cancelledCount] = await Promise.all([
            QueueV2Repository.getActiveQueueByOutlet(outletId, q),
            QueueV2Repository.getCompletedTodayByOutlet(outletId, q),
            QueueV2Repository.getCancelledTodayCount(outletId),
        ]);

        // Sort active orders by schedule time
        const enriched = activeOrders.map((order) => {
            const schedule = computeSchedule(order);
            return { order, sortValue: schedule.start?.getTime() ?? new Date(order.createdAt).getTime() };
        });
        enriched.sort((a, b) => a.sortValue - b.sortValue);

        // Build board columns with per-service position numbering
        const board: QueueBoard = { waiting: [], ready: [], inProgress: [], completed: [] };
        const servicePositionCounters = new Map<string, number>();

        for (const { order } of enriched) {
            const serviceItem = order.items?.find((item: any) => item.product?.type === "SERVICE");
            const serviceProductId = serviceItem?.productId ?? "unknown";

            const currentPos = (servicePositionCounters.get(serviceProductId) ?? 0) + 1;
            servicePositionCounters.set(serviceProductId, currentPos);

            const entry = mapOrderToEntry(order, currentPos);
            const status = order.orderStatus as OrderStatus;

            if (WAITING_STATUSES.includes(status)) {
                board.waiting.push(entry);
            } else if (status === OrderStatus.READY) {
                board.ready.push(entry);
            } else if (status === OrderStatus.ON_GOING) {
                board.inProgress.push(entry);
            }
        }

        // Completed today
        board.completed = completedOrders.map((order, idx) => mapOrderToEntry(order, idx + 1));

        // Calculate stats
        const now = Date.now();
        const waitTimes = board.waiting
            .map((e) => {
                const created = new Date(e.createdAt).getTime();
                return (now - created) / 60000;
            })
            .filter((t) => t > 0);

        const avgWaitMinutes =
            waitTimes.length > 0 ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : null;

        const stats: QueueStats = {
            totalActive: enriched.length,
            waitingCount: board.waiting.length,
            readyCount: board.ready.length,
            inProgressCount: board.inProgress.length,
            completedToday: board.completed.length,
            cancelledToday: cancelledCount,
            avgWaitMinutes,
        };

        return { board, stats };
    }

    static async transitionStatus(
        orderId: string,
        userIdentifier: string,
        nextStatus: OrderStatus,
        validateAsOwner: boolean,
        reason?: string,
    ) {
        return updateServiceQueueStatusService(
            orderId,
            userIdentifier,
            nextStatus,
            validateAsOwner,
            reason,
        );
    }

    static async rescheduleBooking(
        orderId: string,
        userIdentifier: string,
        validateAsOwner: boolean,
        newSlotId: string,
        newDate: Date,
        newStartTime: Date,
        newEndTime: Date,
    ): Promise<QueueEntry> {
        const order = await QueueV2Repository.getOrderById(orderId);
        if (!order) {
            throw new AppError("Antrian tidak ditemukan.", HttpStatus.NOT_FOUND);
        }

        const terminalStatuses: OrderStatus[] = [OrderStatus.COMPLETED, OrderStatus.CANCELLED];
        if (terminalStatuses.includes(order.orderStatus as OrderStatus)) {
            throw new AppError(
                "Antrian yang sudah selesai atau dibatalkan tidak dapat dijadwalkan ulang.",
                HttpStatus.BAD_REQUEST,
            );
        }

        await validateOutletAccess(order.outlet?.id ?? "", userIdentifier, validateAsOwner);

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const targetDate = new Date(newDate);
        targetDate.setHours(0, 0, 0, 0);
        if (targetDate < now) {
            throw new AppError("Tanggal schedulling tidak boleh di masa lalu.", HttpStatus.BAD_REQUEST);
        }

        const updated = await QueueV2Repository.rescheduleBooking(orderId, newSlotId, newDate, newStartTime, newEndTime);
        if (!updated) {
            throw new AppError("Gagal memperbarui jadwal.", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return mapOrderToEntry(updated, 0);
    }
}
