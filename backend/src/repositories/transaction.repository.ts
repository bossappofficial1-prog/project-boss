import { db } from "../config/prisma";
import { PaymentStatus, Prisma } from "@prisma/client";

interface TransactionsFilter {
  outletId?: string;
  userOutletIds: string[];
  status?: string;
  startDate?: string;
  endDate?: string;
  query?: string;
}

export async function findTransactionsByFilter(filter: TransactionsFilter) {
  const { outletId, userOutletIds, status, startDate, endDate, query } = filter;

  const where: any = {
    order: {
      outletId: outletId ? outletId : { in: userOutletIds },
    },
  };

  if (status && status !== "ALL") {
    where.status = status as PaymentStatus;
  }

  if (startDate || endDate) {
    where.createdAt = {};

    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      where.createdAt.lte = endDateTime;
    }
  }

  if (query) {
    where.OR = [
      { externalId: { contains: query, mode: "insensitive" } },
      { order: { guestCustomer: { name: { contains: query, mode: "insensitive" } } } },
    ];
  }

  return db.transaction.findMany({
    where,
    include: {
      verifiedBy: {
        select: {
          name: true,
        },
      },
      order: {
        include: {
          outlet: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          guestCustomer: {
            select: {
              name: true,
              phone: true,
              email: true,
            },
          },
          handledByStaff: {
            select: {
              name: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: `desc` },
  });
}

export async function findExpensesByFilter(filter: {
  outletId?: string;
  userOutletIds: string[];
  startDate?: string;
  endDate?: string;
  query?: string;
}) {
  const { outletId, userOutletIds, startDate, endDate, query } = filter;

  const where: any = {
    outletId: outletId ? outletId : { in: userOutletIds },
  };

  if (startDate || endDate) {
    where.date = {};

    if (startDate) {
      where.date.gte = new Date(startDate);
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      where.date.lte = endDateTime;
    }
  }

  if (query) {
    where.OR = [{ description: { contains: query, mode: "insensitive" } }];
  }

  return db.expense.findMany({
    where,
    include: {
      outlet: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
  });
}

export async function computeTotalsByFilter(
  filter: {
    outletId?: string;
    userOutletIds: string[];
    status?: string;
    startDate?: string;
    endDate?: string;
    query?: string;
  },
  revenueStatuses?: PaymentStatus[],
) {
  const { outletId, userOutletIds, status, startDate, endDate, query } = filter;

  const orderWhere: Prisma.OrderWhereInput = {
    outletId: outletId ? outletId : { in: userOutletIds },
  };

  const normalizedStatuses: PaymentStatus[] | undefined = (() => {
    if (status && status !== "ALL") {
      return [status as PaymentStatus];
    }
    if (revenueStatuses && revenueStatuses.length > 0) {
      return revenueStatuses.map((item) => item as PaymentStatus);
    }
    return undefined;
  })();

  if (normalizedStatuses?.length) {
    orderWhere.paymentStatus =
      normalizedStatuses.length === 1 ? normalizedStatuses[0] : { in: normalizedStatuses };
    orderWhere.transaction = {
      status: normalizedStatuses.length === 1 ? normalizedStatuses[0] : { in: normalizedStatuses },
    };
  } else {
    orderWhere.paymentStatus = PaymentStatus.SUCCESS;
    orderWhere.transaction = { status: PaymentStatus.SUCCESS };
  }

  if (startDate || endDate) {
    orderWhere.createdAt = {};

    if (startDate) orderWhere.createdAt.gte = new Date(startDate);
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      orderWhere.createdAt.lte = endDateTime;
    }
  }

  if (query) {
    orderWhere.OR = [
      { transaction: { externalId: { contains: query, mode: "insensitive" } } },
      { guestCustomer: { name: { contains: query, mode: "insensitive" } } },
    ];
  }

  // Build expense where
  const expenseWhere: any = {
    outletId: outletId ? outletId : { in: userOutletIds },
  };

  if (startDate || endDate) {
    expenseWhere.date = {};
    if (startDate) expenseWhere.date.gte = new Date(startDate);
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      expenseWhere.date.lte = endDateTime;
    }
  }

  if (query) {
    expenseWhere.OR = [{ description: { contains: query, mode: "insensitive" } }];
  }

  const orders = await db.order.findMany({
    where: orderWhere,
    select: {
      totalAmount: true,
    },
  });
  const total_revenue = orders.reduce((acc, order) => {
    return acc + (order.totalAmount > 0 ? order.totalAmount : 0);
  }, 0);
  const expAgg = await db.expense.aggregate({ where: expenseWhere, _sum: { amount: true } });

  const total_expense = expAgg._sum && expAgg._sum.amount ? Number(expAgg._sum.amount) : 0;
  const total_margin_pendapatan = total_revenue - total_expense;

  return {
    total_revenue,
    total_expense,
    total_margin_pendapatan,
  };
}

export async function computeCountsByFilter(filter: {
  outletId?: string;
  userOutletIds: string[];
  status?: string;
  startDate?: string;
  endDate?: string;
  query?: string;
}) {
  const { outletId, userOutletIds, status, startDate, endDate, query } = filter;

  const transactionWhere: any = {
    order: {
      outletId: outletId ? outletId : { in: userOutletIds },
    },
  };

  if (status && status !== "ALL") {
    transactionWhere.status = status;
  }

  if (startDate || endDate) {
    transactionWhere.createdAt = {};
    if (startDate) transactionWhere.createdAt.gte = new Date(startDate);
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      transactionWhere.createdAt.lte = endDateTime;
    }
  }

  if (query) {
    transactionWhere.OR = [
      { externalId: { contains: query, mode: "insensitive" } },
      { order: { guestCustomer: { name: { contains: query, mode: "insensitive" } } } },
    ];
  }

  const expenseWhere: any = {
    outletId: outletId ? outletId : { in: userOutletIds },
  };

  if (startDate || endDate) {
    expenseWhere.date = {};
    if (startDate) expenseWhere.date.gte = new Date(startDate);
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      expenseWhere.date.lte = endDateTime;
    }
  }

  if (query) {
    expenseWhere.OR = [{ description: { contains: query, mode: "insensitive" } }];
  }

  const transactionCount = await db.transaction.count({ where: transactionWhere });
  const expenseCount = await db.expense.count({ where: expenseWhere });

  return { transactionCount, expenseCount };
}
