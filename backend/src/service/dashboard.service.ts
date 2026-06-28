import { db } from "../config/prisma";
import { OutletDashboardRepository } from "../routes/outlet-dashboard.routes";

export async function getDashboardSummaryService(outletId: string) {
  const { totalProducts, totalServices, totalOrders, totalRevenue } =
    await OutletDashboardRepository.getDashboardSummary(outletId);

  return {
    totalProducts,
    totalServices,
    totalOrders,
    totalRevenue,
  };
}

export async function getOrderStatsService(
  outletId: string,
  period: "week" | "month",
) {
  const now = new Date();
  const startDate = new Date();
  if (period === "week") {
    startDate.setDate(now.getDate() - 7);
  } else {
    startDate.setMonth(now.getMonth() - 1);
  }

  const rows = await db.$queryRaw<any[]>`
        SELECT
            date_trunc('day', "createdAt") AS date,
            COUNT(*)::int AS "totalOrders",
            COALESCE(SUM("totalAmount"), 0)::float AS "totalRevenue"
        FROM "Order"
        WHERE "outletId" = ${outletId} AND "createdAt" >= ${startDate}
            AND "orderStatus" = 'COMPLETED' AND "paymentStatus" = 'SUCCESS'
        GROUP BY date_trunc('day', "createdAt")
        ORDER BY date ASC
    `;

  const statsRecord = rows.reduce(
    (acc, row) => {
      const dateObj = row.date instanceof Date ? row.date : new Date(row.date);
      const dateKey = dateObj.toISOString().split("T")[0];
      acc[dateKey] = {
        totalOrders: row.totalOrders,
        totalRevenue: row.totalRevenue,
      };
      return acc;
    },
    {} as Record<string, { totalOrders: number; totalRevenue: number }>,
  );

  return statsRecord;
}
