import { Prisma, Order, GuestCustomer, OrderItem, Product, PaymentStatus } from "@prisma/client";
import { db } from "../config/prisma";

export type DeepIsoDate<T> = T extends Date
  ? string
  : T extends Array<infer U>
    ? Array<DeepIsoDate<U>>
    : T extends object
      ? { [K in keyof T]: DeepIsoDate<T[K]> }
      : T;

// --- TYPINGS ---
export type TransactionMinimal = {
  id: string;
  status: PaymentStatus;
  paymentMethod: string | null;
  isManual: boolean;
  paymentProofUrl: string | null;
  createdAt: Date;
};

export type OrderItemWithProduct = OrderItem & {
  product: Product;
};

export type OrderWithIncludesRaw = Order & {
  guestCustomer: GuestCustomer | null;
  transaction: TransactionMinimal | null;
  items: OrderItemWithProduct[];
};

export type OrderWithIncludes = DeepIsoDate<OrderWithIncludesRaw>;

export type TodayStatsData = {
  completedCount: number;
  cancelledCount: number;
  revenue: number;
};

// Helper Query untuk Select & Join Data yang berulang
const sqlBaseSelect = Prisma.sql`
    SELECT 
        o.*,
        (
            SELECT row_to_json(gc.*) 
            FROM "GuestCustomer" gc 
            WHERE gc.id = o."guestCustomerId"
        ) AS "guestCustomer",
        (
            SELECT json_build_object(
                'id', t.id,
                'status', t.status,
                'paymentMethod', t."paymentMethod",
                'isManual', t."isManual",
                'paymentProofUrl', t."paymentProofUrl",
                'createdAt', t."createdAt"
            ) 
            FROM "Transaction" t 
            WHERE t."orderId" = o.id
        ) AS transaction,
        (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'id', oi.id,
                    'quantity', oi.quantity,
                    'priceAtTimeOfOrder', oi."priceAtTimeOfOrder",
                    'orderId', oi."orderId",
                    'productId', oi."productId",
                    'product', (
                        SELECT row_to_json(p.*) 
                        FROM "Product" p 
                        WHERE p.id = oi."productId"
                    )
                )
            ), '[]'::json)
            FROM "OrderItem" oi 
            WHERE oi."orderId" = o.id
        ) AS items
    FROM "Order" o
`;

function parseAndForceIsoUtc(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (typeof obj === "string") {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*)?(?:[-+]\d{2}:?\d{2}|Z)?$/;
    if (isoDateRegex.test(obj)) {
      const hasTimezone = /(?:[-+]\d{2}:?\d{2}|Z)$/.test(obj);
      const normalized = hasTimezone ? obj : obj + "Z";
      return new Date(normalized).toISOString();
    }
    return obj;
  }

  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(parseAndForceIsoUtc);

  const newObj: any = {};
  for (const key in obj) {
    newObj[key] = parseAndForceIsoUtc(obj[key]);
  }
  return newObj;
}

export class OrdersV2Repository {
  static async getActiveOrdersByOutlet(
    outletId: string,
    q?: string,
    dateStr?: string,
  ): Promise<OrderWithIncludes[]> {
    let searchFilter = Prisma.empty;
    if (q) {
      const searchTerm = `%${q}%`;
      searchFilter = Prisma.sql` AND (
                o.id ILIKE ${searchTerm} OR 
                EXISTS (
                    SELECT 1 FROM "GuestCustomer" gc 
                    WHERE gc.id = o."guestCustomerId" 
                    AND (gc.name ILIKE ${searchTerm} OR gc.phone ILIKE ${searchTerm})
                )
            )`;
    }

    let dateFilter = Prisma.empty;
    if (dateStr) {
      const targetDate = new Date(dateStr);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      dateFilter = Prisma.sql` AND o."createdAt" >= ${startOfDay} AND o."createdAt" <= ${endOfDay}`;
    }

    const rawOrders = await db.$queryRaw<any[]>`
            ${sqlBaseSelect}
            WHERE o."outletId" = ${outletId}
            AND o."orderStatus" IN ('AWAITING_PAYMENT', 'PROCESSING', 'CONFIRMED', 'READY')
            AND EXISTS (
                SELECT 1 FROM "OrderItem" oi
                JOIN "Product" p ON oi."productId" = p.id
                WHERE oi."orderId" = o.id AND p.type IN ('GOODS', 'TICKET')
            )
            ${searchFilter}
            ${dateFilter}
            ORDER BY o."createdAt" DESC
        `;

    return parseAndForceIsoUtc(rawOrders);
  }

  static async getCompletedTodayByOutlet(
    outletId: string,
    q?: string,
    dateStr?: string,
  ): Promise<OrderWithIncludes[]> {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    let searchFilter = Prisma.empty;
    if (q) {
      const searchTerm = `%${q}%`;
      searchFilter = Prisma.sql` AND (
                o.id ILIKE ${searchTerm} OR 
                EXISTS (
                    SELECT 1 FROM "GuestCustomer" gc 
                    WHERE gc.id = o."guestCustomerId" 
                    AND (gc.name ILIKE ${searchTerm} OR gc.phone ILIKE ${searchTerm})
                )
            )`;
    }

    const rawOrders = await db.$queryRaw<any[]>`
            ${sqlBaseSelect}
            WHERE o."outletId" = ${outletId}
            AND o."orderStatus" = 'COMPLETED'
            AND o."updatedAt" >= ${startOfDay}
            AND o."updatedAt" <= ${endOfDay}
            AND EXISTS (
                SELECT 1 FROM "OrderItem" oi
                JOIN "Product" p ON oi."productId" = p.id
                WHERE oi."orderId" = o.id AND p.type IN ('GOODS', 'TICKET')
            )
            ${searchFilter}
            ORDER BY o."updatedAt" DESC
            LIMIT 50
        `;

    return parseAndForceIsoUtc(rawOrders);
  }

  static async getTodayStats(outletId: string, dateStr?: string): Promise<TodayStatsData> {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Optimasi: Menjadikan 3 query (count, count, sum) menjadi 1 raw query tunggal
    const result = await db.$queryRaw<any[]>`
            SELECT 
                COUNT(CASE WHEN o."orderStatus" = 'COMPLETED' THEN 1 END)::int AS "completedCount",
                COUNT(CASE WHEN o."orderStatus" = 'CANCELLED' THEN 1 END)::int AS "cancelledCount",
                COALESCE(SUM(CASE WHEN o."orderStatus" = 'COMPLETED' THEN o."totalAmount" ELSE 0 END), 0)::float AS revenue
            FROM "Order" o
            WHERE o."outletId" = ${outletId}
            AND o."updatedAt" >= ${startOfDay}
            AND o."updatedAt" <= ${endOfDay}
            AND o."orderStatus" IN ('COMPLETED', 'CANCELLED')
            AND EXISTS (
                SELECT 1 FROM "OrderItem" oi
                JOIN "Product" p ON oi."productId" = p.id
                WHERE oi."orderId" = o.id AND p.type IN ('GOODS', 'TICKET')
            )
        `;

    const stats = result[0] || { completedCount: 0, cancelledCount: 0, revenue: 0 };
    return {
      completedCount: stats.completedCount ?? 0,
      cancelledCount: stats.cancelledCount ?? 0,
      revenue: stats.revenue ?? 0,
    };
  }

  static async getBadgeQueueAndOrderCount(outletId: string): Promise<[number, number]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Optimasi: Menjadikan 2 Promise.all() query menjadi 1 raw query tunggal
    const result = await db.$queryRaw<any[]>`
            SELECT
                (
                    SELECT COUNT(o.id)::int FROM "Order" o
                    WHERE o."outletId" = ${outletId}
                    AND o."orderStatus" IN ('AWAITING_PAYMENT', 'PROCESSING')
                    AND o."updatedAt" >= ${startOfDay} AND o."updatedAt" < ${endOfDay}
                    AND EXISTS (
                        SELECT 1 FROM "OrderItem" oi
                        JOIN "Product" p ON oi."productId" = p.id
                        WHERE oi."orderId" = o.id AND p.type IN ('GOODS', 'TICKET')
                    )
                ) as "goodsTicketCount",
                (
                    SELECT COUNT(o.id)::int FROM "Order" o
                    WHERE o."outletId" = ${outletId}
                    AND o."orderStatus" IN ('AWAITING_PAYMENT', 'PROCESSING')
                    AND o."updatedAt" >= ${startOfDay} AND o."updatedAt" < ${endOfDay}
                    AND EXISTS (
                        SELECT 1 FROM "OrderItem" oi
                        JOIN "Product" p ON oi."productId" = p.id
                        WHERE oi."orderId" = o.id AND p.type = 'SERVICE'
                    )
                ) as "serviceCount"
        `;

    const counts = result[0];
    return [counts?.goodsTicketCount ?? 0, counts?.serviceCount ?? 0];
  }
}
