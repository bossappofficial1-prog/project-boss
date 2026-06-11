import { AppError } from "../errors/app-error";
import { getUserByIdService } from "./user.service";
import {
  findTransactionsByFilter,
  findExpensesByFilter,
  computeTotalsByFilter,
  computeCountsByFilter,
} from "../repositories/transaction.repository";
import { PaymentStatus } from "@prisma/client";

interface TransactionListParams {
  userId: string;
  outletId?: string;
  status?: string;
  type?: string; // 'INCOME', 'EXPENSE', 'ALL'
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
  query?: string;
}

/**
 * Get list of transactions and expenses combined based on user's outlets with filters
 */
export async function getTransactionListService(params: TransactionListParams) {
  const {
    userId,
    outletId,
    status,
    type = "ALL", // Default show all
    startDate,
    endDate,
    page = 1,
    limit = 10,
    query,
  } = params;

  const user = await getUserByIdService(userId);

  if (!user || !user.business) {
    throw new AppError("User tidak memiliki bisnis", 404);
  }

  // Get outlet IDs that belong to this user's business
  const userOutletIds = user.business.outlets.map((o) => o.id);

  if (userOutletIds.length === 0) {
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  // Prepare combined data array
  let combinedData: any[] = [];

  // Fetch transactions (INCOME) if type is 'ALL' or 'INCOME'
  if (type === "ALL" || type === "INCOME") {
    // Filtering is delegated to repository (findTransactionsByFilter)

    const transactions = await findTransactionsByFilter({
      outletId,
      userOutletIds,
      status,
      startDate,
      endDate,
      query,
    });

    // Transform transactions to combined format
    const transformedTransactions = transactions.map((transaction: any) => ({
      id: transaction.id,
      type: "INCOME",
      amount: transaction.amount,
      status: transaction.status,
      description: `Penjualan - ${transaction.order.guestCustomer?.name || "Customer"}`,
      paymentMethod: transaction.paymentMethod,
      cashier:
        transaction.order.handledByStaff?.name ??
        transaction.verifiedBy?.name ??
        "Owner",
      isManual: transaction.isManual,
      manualMethod: transaction.manualMethod,
      paymentProofUrl: transaction.paymentProofUrl,
      externalId: transaction.externalId,
      createdAt: transaction.createdAt,
      outlet: transaction.order.outlet,
      order: {
        id: transaction.order.id,
        totalAmount: transaction.order.totalAmount,
        taxAmount: transaction.order.taxAmount ?? 0,
        orderStatus: transaction.order.orderStatus,
        paymentStatus: transaction.order.paymentStatus,
        customerType: transaction.order.customerType,
        midtransFee: transaction.order.midtransFee,
        appFee: transaction.order.appFee,
        createdAt: transaction.order.createdAt,
        guestCustomer: transaction.order.guestCustomer,
        items: transaction.order.items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtTimeOfOrder: item.priceAtTimeOfOrder,
          product: item.product,
        })),
      },
    }));

    combinedData = [...combinedData, ...transformedTransactions];
  }

  // Fetch expenses (EXPENSE) if type is 'ALL' or 'EXPENSE'
  if (type === "ALL" || type === "EXPENSE") {
    const expenseWhere: any = {
      outletId: outletId ? outletId : { in: userOutletIds },
    };

    // Filter by date range
    if (startDate || endDate) {
      expenseWhere.date = {};

      if (startDate) {
        expenseWhere.date.gte = new Date(startDate);
      }

      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        expenseWhere.date.lte = endDateTime;
      }
    }

    const expenses = await findExpensesByFilter({
      outletId,
      userOutletIds,
      startDate,
      endDate,
      query,
    });

    // Transform expenses to combined format
    const transformedExpenses = expenses.map((expense) => ({
      id: expense.id,
      type: "EXPENSE",
      amount: expense.amount,
      status: "SUCCESS", // Expenses are always considered as completed
      description: expense.description,
      paymentMethod: "CASH", // Default for expenses
      cashier: expense.cashier,
      isManual: true,
      manualMethod: null,
      paymentProofUrl: null,
      externalId: null,
      createdAt: expense.date, // Use expense date as createdAt
      outlet: expense.outlet,
      order: null, // No order for expenses
    }));

    combinedData = [...combinedData, ...transformedExpenses];
  }

  // Sort combined data by date (newest first)
  combinedData.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Calculate totals on DB level for performance. Default: only count INCOME with status 'SUCCESS' unless caller provided a specific status filter.
  let revenueStatuses: PaymentStatus[] | undefined = undefined;
  if (!status || status === "ALL") {
    // default revenue definition: only SUCCESS transactions
    revenueStatuses = ["SUCCESS"];
  }

  // If caller provided a specific status (and not 'ALL'), the repository will use it.
  const totals = await computeTotalsByFilter(
    { outletId, userOutletIds, status, startDate, endDate, query },
    revenueStatuses,
  );

  const total_revenue = totals.total_revenue;
  const total_expense = totals.total_expense;
  const total_margin_pendapatan = totals.total_margin_pendapatan;

  // Use DB counts for total/pagination to avoid loading counts from memory
  const counts = await computeCountsByFilter({
    outletId,
    userOutletIds,
    status,
    startDate,
    endDate,
    query,
  });
  let total = 0;
  if (type === "ALL") {
    total = counts.transactionCount + counts.expenseCount;
  } else if (type === "INCOME") {
    total = counts.transactionCount;
  } else if (type === "EXPENSE") {
    total = counts.expenseCount;
  }

  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = combinedData.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    totals: {
      total_revenue: total_revenue ?? 0,
      total_expense: total_expense ?? 0,
      total_margin_pendapatan: total_margin_pendapatan ?? 0,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}
