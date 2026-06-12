import { BaseService } from './base.service';
import { db } from '../config/prisma';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface DashboardAnalytics {
  snapshot: {
    totalBusinesses: number;
    activeBusinesses: number;
    totalUsers: number;
    totalRevenue: number;
    mrr: number;
    arr: number;
  };
  churnRate: {
    monthly: number;
    quarterly: number;
    trend: Array<{ month: string; rate: number }>;
  };
  ltv: {
    average: number;
    byPlan: Array<{ plan: string; ltv: number }>;
    trend: Array<{ month: string; ltv: number }>;
  };
  cohortRetention: Array<{
    cohort: string;
    size: number;
    retention: number[];
  }>;
  mrrGrowth: {
    current: number;
    previous: number;
    growthRate: number;
    expansion: number;
    contraction: number;
    net: number;
    trend: Array<{ month: string; mrr: number }>;
  };
  arpu: {
    current: number;
    byPlan: Array<{ plan: string; arpu: number }>;
    trend: Array<{ month: string; arpu: number }>;
  };
  netRevenueRetention: {
    current: number;
    trend: Array<{ month: string; nrr: number }>;
  };
}

export class AdminAnalyticsService extends BaseService {
  private readonly CACHE_KEY = 'admin:dashboard:analytics';
  private readonly CACHE_TTL = 300; // 5 minutes

  async getFullAnalytics(): Promise<DashboardAnalytics> {
    const cached = await redis.get(this.CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }

    const [snapshot, churnRate, ltv, cohortRetention, mrrGrowth, arpu, netRevenueRetention] =
      await Promise.all([
        this.getSnapshot(),
        this.getChurnRate(),
        this.getLTV(),
        this.getCohortRetention(),
        this.getMRRGrowth(),
        this.getARPU(),
        this.getNetRevenueRetention(),
      ]);

    const analytics: DashboardAnalytics = {
      snapshot,
      churnRate,
      ltv,
      cohortRetention,
      mrrGrowth,
      arpu,
      netRevenueRetention,
    };

    await redis.setex(this.CACHE_KEY, this.CACHE_TTL, JSON.stringify(analytics));

    return analytics;
  }

  private async getSnapshot() {
    const [totalBusinesses, activeBusinesses, totalUsers, revenueAgg, subscriptionAgg] =
      await Promise.all([
        db.business.count(),
        db.business.count({ where: { subscriptionStatus: 'ACTIVE' } }),
        db.user.count(),
        db.order.aggregate({
          where: { paymentStatus: 'SUCCESS' },
          _sum: { totalAmount: true },
        }),
        db.businessSubscription.aggregate({
          where: { status: 'ACTIVE' },
          _sum: { pricePerCycle: true },
        }),
      ]);

    const totalRevenue = revenueAgg._sum.totalAmount || 0;
    const mrr = subscriptionAgg._sum.pricePerCycle || 0;
    const arr = mrr * 12;

    return {
      totalBusinesses,
      activeBusinesses,
      totalUsers,
      totalRevenue,
      mrr,
      arr,
    };
  }

  private async getChurnRate() {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    // Get churned businesses (status changed to EXPIRED/CANCELLED/SUSPENDED)
    const churnedByMonth = await db.$queryRaw<
      Array<{ month: string; churned: bigint; total: bigint }>
    >`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "updatedAt"), 'YYYY-MM') as month,
        COUNT(*) FILTER (WHERE "subscriptionStatus" IN ('EXPIRED', 'CANCELLED', 'SUSPENDED')) as churned,
        COUNT(*) as total
      FROM "Business"
      WHERE "updatedAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "updatedAt")
      ORDER BY month
    `;

    const trend = churnedByMonth.map((row) => ({
      month: row.month,
      rate: Number(row.total) > 0
        ? Math.round((Number(row.churned) / Number(row.total)) * 100 * 10) / 10
        : 0,
    }));

    const currentMonth = trend[trend.length - 1];
    const previousMonth = trend[trend.length - 2];

    return {
      monthly: currentMonth?.rate || 0,
      quarterly: trend.length >= 3
        ? Math.round(
            ((trend[trend.length - 1].rate + trend[trend.length - 2].rate + trend[trend.length - 3].rate) / 3) * 10
          ) / 10
        : currentMonth?.rate || 0,
      trend,
    };
  }

  private async getLTV() {
    const businesses = await db.business.findMany({
      where: {
        subscriptionStatus: 'ACTIVE',
        currentSubscriptionId: { not: null },
      },
      select: {
        id: true,
        subscriptionPlan: true,
        subscriptionStartDate: true,
        currentSubscription: {
          select: { pricePerCycle: true, billingCycle: true },
        },
        orders: {
          where: { paymentStatus: 'SUCCESS' },
          select: { totalAmount: true },
        },
      },
    });

    const byPlan: Record<string, { totalRevenue: number; count: number }> = {};
    let totalLTV = 0;
    let count = 0;

    for (const biz of businesses) {
      const totalSpend = biz.orders.reduce((sum, o) => sum + o.totalAmount, 0);
      const monthsActive = Math.max(
        1,
        Math.ceil(
          (Date.now() - biz.subscriptionStartDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
        )
      );
      const ltv = totalSpend > 0 ? totalSpend : (biz.currentSubscription?.pricePerCycle || 0) * monthsActive;

      totalLTV += ltv;
      count++;

      if (!byPlan[biz.subscriptionPlan]) {
        byPlan[biz.subscriptionPlan] = { totalRevenue: 0, count: 0 };
      }
      byPlan[biz.subscriptionPlan].totalRevenue += ltv;
      byPlan[biz.subscriptionPlan].count++;
    }

    // Get trend for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trend = await db.$queryRaw<
      Array<{ month: string; avg_ltv: number }>
    >`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', o."createdAt"), 'YYYY-MM') as month,
        AVG(o."totalAmount") as avg_ltv
      FROM "Order" o
      JOIN "Outlet" ot ON o."outletId" = ot.id
      JOIN "Business" b ON ot."businessId" = b.id
      WHERE o."paymentStatus" = 'SUCCESS'
        AND o."createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', o."createdAt")
      ORDER BY month
    `;

    return {
      average: count > 0 ? Math.round(totalLTV / count) : 0,
      byPlan: Object.entries(byPlan).map(([plan, data]) => ({
        plan,
        ltv: data.count > 0 ? Math.round(data.totalRevenue / data.count) : 0,
      })),
      trend: trend.map((row) => ({
        month: row.month,
        ltv: Math.round(Number(row.avg_ltv)),
      })),
    };
  }

  private async getCohortRetention() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const cohorts = await db.$queryRaw<
      Array<{ cohort: string; size: bigint; active: bigint; months_since: number }>
    >`
      WITH cohort_data AS (
        SELECT 
          b.id,
          TO_CHAR(DATE_TRUNC('month', b."subscriptionStartDate"), 'YYYY-MM') as cohort,
          DATE_TRUNC('month', b."subscriptionStartDate") as cohort_start,
          CASE WHEN b."subscriptionStatus" = 'ACTIVE' THEN 1 ELSE 0 END as is_active,
          EXTRACT(MONTH FROM AGE(NOW(), b."subscriptionStartDate")) as months_since
        FROM "Business" b
        WHERE b."subscriptionStartDate" >= ${sixMonthsAgo}
      )
      SELECT 
        cohort,
        COUNT(*) as size,
        SUM(is_active) as active,
        months_since
      FROM cohort_data
      GROUP BY cohort, months_since
      ORDER BY cohort
    `;

    const cohortMap: Record<string, { size: number; retention: number[] }> = {};

    for (const row of cohorts) {
      if (!cohortMap[row.cohort]) {
        cohortMap[row.cohort] = { size: Number(row.size), retention: [] };
      }
      const retentionRate =
        Number(row.size) > 0
          ? Math.round((Number(row.active) / Number(row.size)) * 100)
          : 0;
      cohortMap[row.cohort].retention.push(retentionRate);
    }

    return Object.entries(cohortMap).map(([cohort, data]) => ({
      cohort,
      size: data.size,
      retention: data.retention,
    }));
  }

  private async getMRRGrowth() {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const currentMRR = await db.businessSubscription.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { pricePerCycle: true },
    });

    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMRR = await db.$queryRaw<Array<{ mrr: number }>>`
      SELECT COALESCE(SUM("pricePerCycle"), 0) as mrr
      FROM "BusinessSubscription"
      WHERE status = 'ACTIVE'
        AND "createdAt" < ${previousMonth}
    `;

    const current = currentMRR._sum.pricePerCycle || 0;
    const previous = Number(previousMRR[0]?.mrr || 0);
    const growthRate = previous > 0 ? Math.round(((current - previous) / previous) * 100 * 10) / 10 : 0;

    // Expansion revenue (upgrades)
    const expansion = await db.$queryRaw<Array<{ amount: number }>>`
      SELECT COALESCE(SUM(bs2."pricePerCycle" - bs1."pricePerCycle"), 0) as amount
      FROM "BusinessSubscription" bs1
      JOIN "BusinessSubscription" bs2 ON bs1."businessId" = bs2."businessId"
      WHERE bs1.status = 'SUPERSEDED'
        AND bs2.status = 'ACTIVE'
        AND bs2."pricePerCycle" > bs1."pricePerCycle"
        AND bs2."createdAt" >= ${sixMonthsAgo}
    `;

    // Contraction revenue (downgrades)
    const contraction = await db.$queryRaw<Array<{ amount: number }>>`
      SELECT COALESCE(SUM(bs1."pricePerCycle" - bs2."pricePerCycle"), 0) as amount
      FROM "BusinessSubscription" bs1
      JOIN "BusinessSubscription" bs2 ON bs1."businessId" = bs2."businessId"
      WHERE bs1.status = 'SUPERSEDED'
        AND bs2.status = 'ACTIVE'
        AND bs2."pricePerCycle" < bs1."pricePerCycle"
        AND bs2."createdAt" >= ${sixMonthsAgo}
    `;

    // MRR trend
    const trend = await db.$queryRaw<Array<{ month: string; mrr: number }>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
        SUM("pricePerCycle") as mrr
      FROM "BusinessSubscription"
      WHERE status = 'ACTIVE'
        AND "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month
    `;

    return {
      current,
      previous,
      growthRate,
      expansion: Number(expansion[0]?.amount || 0),
      contraction: Number(contraction[0]?.amount || 0),
      net: current - previous,
      trend: trend.map((row) => ({
        month: row.month,
        mrr: Number(row.mrr),
      })),
    };
  }

  private async getARPU() {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const [activeBusinesses, revenueByPlan] = await Promise.all([
      db.business.count({ where: { subscriptionStatus: 'ACTIVE' } }),
      db.business.groupBy({
        by: ['subscriptionPlan'],
        where: { subscriptionStatus: 'ACTIVE' },
        _count: { id: true },
      }),
    ]);

    const planRevenue = await db.$queryRaw<
      Array<{ plan: string; revenue: number; count: number }>
    >`
      SELECT 
        b."subscriptionPlan" as plan,
        SUM(bs."pricePerCycle") as revenue,
        COUNT(*) as count
      FROM "Business" b
      JOIN "BusinessSubscription" bs ON b."currentSubscriptionId" = bs.id
      WHERE b."subscriptionStatus" = 'ACTIVE'
      GROUP BY b."subscriptionPlan"
    `;

    const totalRevenue = planRevenue.reduce((sum, row) => sum + Number(row.revenue), 0);
    const current = activeBusinesses > 0 ? Math.round(totalRevenue / activeBusinesses) : 0;

    // ARPU trend
    const trend = await db.$queryRaw<Array<{ month: string; arpu: number }>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', o."createdAt"), 'YYYY-MM') as month,
        SUM(o."totalAmount") / COUNT(DISTINCT b.id) as arpu
      FROM "Order" o
      JOIN "Outlet" ot ON o."outletId" = ot.id
      JOIN "Business" b ON ot."businessId" = b.id
      WHERE o."paymentStatus" = 'SUCCESS'
        AND o."createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', o."createdAt")
      ORDER BY month
    `;

    return {
      current,
      byPlan: planRevenue.map((row) => ({
        plan: row.plan,
        arpu: Number(row.count) > 0 ? Math.round(Number(row.revenue) / Number(row.count)) : 0,
      })),
      trend: trend.map((row) => ({
        month: row.month,
        arpu: Math.round(Number(row.arpu)),
      })),
    };
  }

  private async getNetRevenueRetention() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // NRR = (Starting MRR + Expansion - Contraction - Churn) / Starting MRR * 100
    const nrrData = await db.$queryRaw<
      Array<{ month: string; starting: number; ending: number; nrr: number }>
    >`
      WITH monthly_mrr AS (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
          DATE_TRUNC('month', "createdAt") as month_date,
          SUM("pricePerCycle") as mrr
        FROM "BusinessSubscription"
        WHERE status IN ('ACTIVE', 'SUPERSEDED')
          AND "createdAt" >= ${sixMonthsAgo}
        GROUP BY DATE_TRUNC('month', "createdAt")
      )
      SELECT 
        m1.month,
        COALESCE(m1.mrr, 0) as starting,
        COALESCE(m2.mrr, 0) as ending,
        CASE 
          WHEN COALESCE(m1.mrr, 0) > 0 
          THEN ROUND((COALESCE(m2.mrr, 0) / COALESCE(m1.mrr, 0)) * 100, 1)
          ELSE 0 
        END as nrr
      FROM monthly_mrr m1
      LEFT JOIN monthly_mrr m2 ON m2.month_date = m1.month_date + INTERVAL '1 month'
      ORDER BY m1.month
    `;

    const current = nrrData.length > 0 ? Number(nrrData[nrrData.length - 1].nrr) : 100;

    return {
      current,
      trend: nrrData.map((row) => ({
        month: row.month,
        nrr: Number(row.nrr),
      })),
    };
  }

  async clearCache() {
    await redis.del(this.CACHE_KEY);
  }
}
