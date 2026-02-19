import { OrderStatus } from "@prisma/client";
import { OrdersV2Repository } from "../repositories/orders-v2.repository";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { getOutletByIdService } from "./outlet.service";
import { getBusinessByIdService } from "./business.service";

interface OrderItemEntry {
    productName: string;
    quantity: number;
    price: number;
}

interface OrderEntry {
    id: string;
    orderStatus: OrderStatus;
    totalAmount: number;
    customerName: string;
    customerPhone: string | null;
    items: OrderItemEntry[];
    paymentMethod: string | null;
    isManualPayment: boolean;
    paymentProofUrl: string | null;
    paymentStatus: string | null;
    createdAt: string;
    updatedAt: string;
    cancellationReason: string | null;
}

interface OrdersBoard {
    pending: OrderEntry[];
    processing: OrderEntry[];
    ready: OrderEntry[];
    completed: OrderEntry[];
}

interface OrdersStats {
    totalActive: number;
    pendingCount: number;
    processingCount: number;
    readyCount: number;
    completedToday: number;
    cancelledToday: number;
    revenueToday: number;
}

const MANUAL_METHODS = ["manual", "manual_transfer", "transfer", "cash"];

function mapOrder(order: any): OrderEntry {
    const tx = order.transaction;
    const method = tx?.paymentMethod ?? order.paymentMethod ?? null;
    const isManual = tx?.isManual === true ||
        (typeof method === "string" && MANUAL_METHODS.some((m) => method.toLowerCase().includes(m)));

    return {
        id: order.id,
        orderStatus: order.orderStatus,
        totalAmount: Number(order.totalAmount),
        customerName: order.guestCustomer?.name ?? "Customer",
        customerPhone: order.guestCustomer?.phone ?? null,
        items: (order.items ?? []).map((item: any) => ({
            productName: item.product?.name ?? "Produk",
            quantity: item.quantity,
            price: Number(item.priceAtTimeOfOrder),
            productType: item.product.type
        })),
        paymentMethod: method,
        isManualPayment: isManual,
        paymentProofUrl: tx?.paymentProofUrl ?? null,
        paymentStatus: tx?.status ?? order.paymentStatus ?? null,
        createdAt: order.createdAt?.toISOString?.() ?? order.createdAt,
        updatedAt: order.updatedAt?.toISOString?.() ?? order.updatedAt,
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
                "Anda hanya bisa mengakses pesanan outlet Anda sendiri.",
                HttpStatus.FORBIDDEN,
            );
        }
    }
}

export class OrdersV2Service {
    static async getBoard(
        outletId: string,
        userIdentifier: string,
        validateAsOwner = true,
    ): Promise<{ board: OrdersBoard; stats: OrdersStats }> {
        await validateOutletAccess(outletId, userIdentifier, validateAsOwner);

        const [activeOrders, completedOrders, todayStats] = await Promise.all([
            OrdersV2Repository.getActiveOrdersByOutlet(outletId),
            OrdersV2Repository.getCompletedTodayByOutlet(outletId),
            OrdersV2Repository.getTodayStats(outletId),
        ]);

        const board: OrdersBoard = {
            pending: [],
            processing: [],
            ready: [],
            completed: [],
        };

        for (const order of activeOrders) {
            const entry = mapOrder(order);
            const status = order.orderStatus as OrderStatus;

            if (status === OrderStatus.AWAITING_PAYMENT) {
                board.pending.push(entry);
            } else if (status === OrderStatus.PROCESSING || status === OrderStatus.CONFIRMED) {
                board.processing.push(entry);
            } else if (status === OrderStatus.READY) {
                board.ready.push(entry);
            }
        }

        board.completed = completedOrders.map(mapOrder);

        const stats: OrdersStats = {
            totalActive: activeOrders.length,
            pendingCount: board.pending.length,
            processingCount: board.processing.length,
            readyCount: board.ready.length,
            completedToday: todayStats.completedCount,
            cancelledToday: todayStats.cancelledCount,
            revenueToday: todayStats.revenue,
        };

        return { board, stats };
    }

    static async getBadgeQueueAndOrderCount(outletId: string) {
        const [orderBadgeCount, serviceBadgeCount] = await OrdersV2Repository.getBadgeQueueAndOrderCount(outletId);

        return { orderBadgeCount, serviceBadgeCount }
    }
}
