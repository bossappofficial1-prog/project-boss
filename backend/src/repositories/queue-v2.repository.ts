import { Prisma, Order, GuestCustomer, OrderItem, Product, Outlet, Transaction, Staff, BookingSlot, ProductService, ProductGoods } from "@prisma/client";
import { db } from "../config/prisma";
import { parseAndForceIsoUtc } from "./helper";

export type DeepIsoDate<T> = T extends Date ? string :
    T extends Array<infer U> ? Array<DeepIsoDate<U>> :
    T extends object ? { [K in keyof T]: DeepIsoDate<T[K]> } :
    T;

export type ProductWithDetails = Product & {
    service: ProductService | null;
    goods: ProductGoods | null;
};

export type QueueItemWithProduct = OrderItem & {
    product: ProductWithDetails;
    bookingSlot: BookingSlot | null;
};

export type QueueOrderWithIncludesRaw = Order & {
    guestCustomer: GuestCustomer | null;
    outlet: Outlet | null;
    transaction: Transaction | null;
    handledByStaff: Staff | null;
    items: QueueItemWithProduct[];
};

export type QueueOrderWithIncludes = DeepIsoDate<QueueOrderWithIncludesRaw>;

// Helper Query untuk Select & Join Data yang berulang
const sqlQueueBaseSelect = Prisma.sql`
    SELECT 
        o.*,
        (
            SELECT row_to_json(gc.*) 
            FROM "GuestCustomer" gc 
            WHERE gc.id = o."guestCustomerId"
        ) AS "guestCustomer",
        (
            SELECT row_to_json(out.*) 
            FROM "Outlet" out 
            WHERE out.id = o."outletId"
        ) AS outlet,
        (
            SELECT row_to_json(t.*) 
            FROM "Transaction" t 
            WHERE t."orderId" = o.id
        ) AS transaction,
        (
            SELECT row_to_json(s.*) 
            FROM "Staff" s 
            WHERE s.id = o."handledByStaffId"
        ) AS "handledByStaff",
        (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'id', oi.id,
                    'quantity', oi.quantity,
                    'priceAtTimeOfOrder', oi."priceAtTimeOfOrder",
                    'orderId', oi."orderId",
                    'productId', oi."productId",
                    'product', (
                        SELECT json_build_object(
                            'id', p.id,
                            'name', p.name,
                            'description', p.description,
                            'type', p.type,
                            'status', p.status,
                            'outletId', p."outletId",
                            'image', p.image,
                            'createdAt', p."createdAt",
                            'updatedAt', p."updatedAt",
                            'service', (SELECT row_to_json(ps.*) FROM "ProductService" ps WHERE ps."productId" = p.id),
                            'goods', (SELECT row_to_json(pg.*) FROM "ProductGoods" pg WHERE pg."productId" = p.id)
                        )
                        FROM "Product" p 
                        WHERE p.id = oi."productId"
                    ),
                    'bookingSlot', (
                        SELECT row_to_json(bs.*) 
                        FROM "BookingSlot" bs 
                        WHERE bs."orderItemId" = oi.id
                    )
                )
            ), '[]'::json)
            FROM "OrderItem" oi 
            WHERE oi."orderId" = o.id
        ) AS items
    FROM "Order" o
`;

export class QueueV2Repository {

    static async getActiveQueueByOutlet(outletId: string, q?: string): Promise<QueueOrderWithIncludes[]> {
        const searchFilter = q ? Prisma.sql` AND o.id ILIKE ${'%' + q + '%'}` : Prisma.empty;

        const rawOrders = await db.$queryRaw<any[]>`
            ${sqlQueueBaseSelect}
            WHERE o."outletId" = ${outletId}
            AND o."orderStatus" IN ('AWAITING_PAYMENT', 'PROCESSING', 'CONFIRMED', 'READY', 'ON_GOING')
            AND EXISTS (
                SELECT 1 FROM "OrderItem" oi
                JOIN "Product" p ON oi."productId" = p.id
                WHERE oi."orderId" = o.id AND p.type = 'SERVICE'
            )
            ${searchFilter}
            ORDER BY o."createdAt" ASC
        `;

        return parseAndForceIsoUtc(rawOrders);
    }

    static async getCompletedTodayByOutlet(outletId: string, q?: string): Promise<QueueOrderWithIncludes[]> {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const searchFilter = q ? Prisma.sql` AND o.id ILIKE ${'%' + q + '%'}` : Prisma.empty;

        const rawOrders = await db.$queryRaw<any[]>`
            ${sqlQueueBaseSelect}
            WHERE o."outletId" = ${outletId}
            AND o."orderStatus" = 'COMPLETED'
            AND o."updatedAt" >= ${startOfDay}
            AND EXISTS (
                SELECT 1 FROM "OrderItem" oi
                JOIN "Product" p ON oi."productId" = p.id
                WHERE oi."orderId" = o.id AND p.type = 'SERVICE'
            )
            ${searchFilter}
            ORDER BY o."updatedAt" DESC
        `;

        return parseAndForceIsoUtc(rawOrders);
    }

    static async getCancelledTodayCount(outletId: string): Promise<number> {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const result = await db.$queryRaw<{ count: number }[]>`
            SELECT COUNT(o.id)::int as count
            FROM "Order" o
            WHERE o."outletId" = ${outletId}
            AND o."orderStatus" = 'CANCELLED'
            AND o."updatedAt" >= ${startOfDay}
            AND EXISTS (
                SELECT 1 FROM "OrderItem" oi
                JOIN "Product" p ON oi."productId" = p.id
                WHERE oi."orderId" = o.id AND p.type = 'SERVICE'
            )
        `;

        return result[0]?.count || 0;
    }

    static async getOrderById(orderId: string): Promise<QueueOrderWithIncludes | null> {
        const rawOrders = await db.$queryRaw<any[]>`
            ${sqlQueueBaseSelect}
            WHERE o.id = ${orderId}
            LIMIT 1
        `;

        const parsed = parseAndForceIsoUtc(rawOrders);
        return parsed[0] || null;
    }

    static async rescheduleBooking(
        orderId: string,
        newSlotId: string,
        newDate: Date,
        newStartTime: Date,
        newEndTime: Date,
    ): Promise<QueueOrderWithIncludes | null> {
        await db.$transaction(async (tx) => {
            // Cari OrderItem SERVICE yang punya BookingSlot (slot lama)
            const orderItem = await tx.orderItem.findFirst({
                where: {
                    orderId,
                    product: { type: "SERVICE" },
                    bookingSlot: { isNot: null },
                },
                include: { bookingSlot: true },
            });

            // 1. Bebaskan slot lama → AVAILABLE
            if (orderItem?.bookingSlot) {
                await tx.bookingSlot.update({
                    where: { id: orderItem.bookingSlot.id },
                    data: {
                        status: "AVAILABLE",
                        orderItemId: null,
                    },
                });
            }

            // 2. Kunci slot baru → BOOKED dan hubungkan ke orderItem
            await tx.bookingSlot.update({
                where: { id: newSlotId },
                data: {
                    status: "BOOKED",
                    orderItemId: orderItem?.id ?? null,
                },
            });

            // 3. Update bookingDate pada Order
            await tx.order.update({
                where: { id: orderId },
                data: { bookingDate: newDate },
            });
        });

        return this.getOrderById(orderId);
    }
}