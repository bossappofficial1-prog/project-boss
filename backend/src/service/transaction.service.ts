import { db } from "../config/prisma";
import { AppError } from "../errors/app-error";
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
}

/**
 * Get list of transactions and expenses combined based on user's outlets with filters
 */
export async function getTransactionListService(params: TransactionListParams) {
    const {
        userId,
        outletId,
        status,
        type = 'ALL', // Default show all
        startDate,
        endDate,
        page = 1,
        limit = 10,
    } = params;

    // Validate user exists and get their business
    const user = await db.user.findUnique({
        where: { id: userId },
        include: {
            business: {
                include: {
                    outlets: {
                        select: { id: true }
                    }
                }
            }
        }
    });

    if (!user || !user.business) {
        throw new AppError("User tidak memiliki bisnis", 404);
    }

    // Get outlet IDs that belong to this user's business
    const userOutletIds = user.business.outlets.map(o => o.id);

    if (userOutletIds.length === 0) {
        return {
            data: [],
            pagination: {
                page,
                limit,
                total: 0,
                totalPages: 0
            }
        };
    }

    // Prepare combined data array
    let combinedData: any[] = [];

    // Fetch transactions (INCOME) if type is 'ALL' or 'INCOME'
    if (type === 'ALL' || type === 'INCOME') {
        const transactionWhere: any = {
            order: {
                outletId: outletId ? outletId : { in: userOutletIds }
            }
        };

        // Filter by status if provided
        if (status && status !== 'ALL') {
            transactionWhere.status = status as PaymentStatus;
        }

        // Filter by date range
        if (startDate || endDate) {
            transactionWhere.createdAt = {};
            
            if (startDate) {
                transactionWhere.createdAt.gte = new Date(startDate);
            }
            
            if (endDate) {
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                transactionWhere.createdAt.lte = endDateTime;
            }
        }

        const transactions = await db.transaction.findMany({
            where: transactionWhere,
            include: {
                order: {
                    include: {
                        outlet: {
                            select: {
                                id: true,
                                name: true,
                                address: true
                            }
                        },
                        guestCustomer: {
                            select: {
                                name: true,
                                phone: true,
                                email: true
                            }
                        },
                        items: {
                            include: {
                                product: {
                                    select: {
                                        name: true,
                                        price: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Transform transactions to combined format
        const transformedTransactions = transactions.map(transaction => ({
            id: transaction.id,
            type: 'INCOME',
            amount: transaction.amount,
            status: transaction.status,
            description: `Penjualan - ${transaction.order.guestCustomer?.name || 'Customer'}`,
            paymentMethod: transaction.paymentMethod,
            isManual: transaction.isManual,
            manualMethod: transaction.manualMethod,
            paymentProofUrl: transaction.paymentProofUrl,
            externalId: transaction.externalId,
            createdAt: transaction.createdAt,
            outlet: transaction.order.outlet,
            order: {
                id: transaction.order.id,
                totalAmount: transaction.order.totalAmount,
                orderStatus: transaction.order.orderStatus,
                paymentStatus: transaction.order.paymentStatus,
                customerType: transaction.order.customerType,
                midtransFee: transaction.order.midtransFee,
                appFee: transaction.order.appFee,
                discountAmount: transaction.order.discountAmount,
                createdAt: transaction.order.createdAt,
                guestCustomer: transaction.order.guestCustomer,
                items: transaction.order.items.map(item => ({
                    id: item.id,
                    quantity: item.quantity,
                    priceAtTimeOfOrder: item.priceAtTimeOfOrder,
                    product: item.product
                }))
            }
        }));

        combinedData = [...combinedData, ...transformedTransactions];
    }

    // Fetch expenses (EXPENSE) if type is 'ALL' or 'EXPENSE'
    if (type === 'ALL' || type === 'EXPENSE') {
        const expenseWhere: any = {
            outletId: outletId ? outletId : { in: userOutletIds }
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

        const expenses = await db.expense.findMany({
            where: expenseWhere,
            include: {
                outlet: {
                    select: {
                        id: true,
                        name: true,
                        address: true
                    }
                }
            }
        });

        // Transform expenses to combined format
        const transformedExpenses = expenses.map(expense => ({
            id: expense.id,
            type: 'EXPENSE',
            amount: expense.amount,
            status: 'SUCCESS', // Expenses are always considered as completed
            description: expense.description,
            paymentMethod: 'CASH', // Default for expenses
            isManual: true,
            manualMethod: null,
            paymentProofUrl: null,
            externalId: null,
            createdAt: expense.date, // Use expense date as createdAt
            outlet: expense.outlet,
            order: null // No order for expenses
        }));

        combinedData = [...combinedData, ...transformedExpenses];
    }

    // Sort combined data by date (newest first)
    combinedData.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Apply pagination
    const total = combinedData.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = combinedData.slice(startIndex, endIndex);

    return {
        data: paginatedData,
        pagination: {
            page,
            limit,
            total,
            totalPages
        }
    };
}
