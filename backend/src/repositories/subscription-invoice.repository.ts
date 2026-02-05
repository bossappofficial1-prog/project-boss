import { PaymentStatus, Prisma, SubscriptionStatus } from "@prisma/client";
import { db } from "../config/prisma";

const subscriptionInvoiceInclude = {
    business: {
        include: {
            owner: true,
        },
    },
    subscription: {
        include: {
            plan: true,
        },
    },
} satisfies Prisma.SubscriptionInvoiceInclude;

export type SubscriptionInvoiceWithRelations = Prisma.SubscriptionInvoiceGetPayload<{
    include: typeof subscriptionInvoiceInclude;
}>;

export type SubscriptionInvoiceListOptions = {
    status?: PaymentStatus[];
    search?: string;
    page?: number;
    limit?: number;
};

export class SubscriptionInvoiceRepository {
    static async listInvoices(options: SubscriptionInvoiceListOptions = {}) {
        const { status, search, page = 1, limit = 20 } = options;
        const take = Math.min(Math.max(limit, 1), 100);
        const skip = (Math.max(page, 1) - 1) * take;

        const where: Prisma.SubscriptionInvoiceWhereInput = {
            ...(status && status.length > 0 ? { status: { in: status } } : {}),
            ...(search
                ? {
                    OR: [
                        { invoiceNumber: { contains: search, mode: "insensitive" } },
                        { business: { name: { contains: search, mode: "insensitive" } } },
                        { business: { owner: { name: { contains: search, mode: "insensitive" } } } },
                        { business: { owner: { email: { contains: search, mode: "insensitive" } } } },
                    ],
                }
                : {}),
        };

        const [total, invoices] = await db.$transaction([
            db.subscriptionInvoice.count({ where }),
            db.subscriptionInvoice.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take,
                include: subscriptionInvoiceInclude,
            }),
        ]);

        return {
            data: invoices,
            total,
            page: Math.max(page, 1),
            limit: take,
            totalPages: Math.ceil(total / take) || 1,
        };
    }

    static async findById(id: string) {
        return db.subscriptionInvoice.findUnique({
            where: { id },
            include: subscriptionInvoiceInclude,
        });
    }

    static async verifyInvoice(invoiceId: string) {
        return db.$transaction(async (tx) => {
            const invoice = await tx.subscriptionInvoice.findUnique({
                where: { id: invoiceId },
                include: subscriptionInvoiceInclude,
            });

            if (!invoice) {
                return null;
            }

            const now = new Date();

            await tx.subscriptionInvoice.update({
                where: { id: invoiceId },
                data: {
                    status: PaymentStatus.SUCCESS,
                    verifiedAt: now,
                    paidAt: now,
                    rejectionReason: null,
                },
            });

            await tx.businessSubscription.update({
                where: { id: invoice.subscriptionId },
                data: {
                    status: SubscriptionStatus.ACTIVE,
                },
            });

            await tx.business.update({
                where: { id: invoice.businessId },
                data: {
                    subscriptionStatus: SubscriptionStatus.ACTIVE,
                    subscriptionStartDate: invoice.subscription.startDate,
                    subscriptionEndDate: invoice.subscription.endDate,
                    currentSubscriptionId: invoice.subscriptionId,
                    subscriptionPlan: invoice.subscription.plan.code,
                },
            });

            return tx.subscriptionInvoice.findUnique({
                where: { id: invoiceId },
                include: subscriptionInvoiceInclude,
            });
        });
    }

    static async rejectInvoice(invoiceId: string, reason: string) {
        return db.$transaction(async (tx) => {
            const invoice = await tx.subscriptionInvoice.findUnique({
                where: { id: invoiceId },
                include: subscriptionInvoiceInclude,
            });

            if (!invoice) {
                return null;
            }

            const now = new Date();

            await tx.subscriptionInvoice.update({
                where: { id: invoiceId },
                data: {
                    status: PaymentStatus.REJECTED_MANUAL,
                    rejectionReason: reason,
                    verifiedAt: now,
                    paidAt: null,
                    proofImage: null,
                    proofUploadedAt: null,
                },
            });

            await tx.businessSubscription.update({
                where: { id: invoice.subscriptionId },
                data: {
                    status: SubscriptionStatus.AWAITING_PAYMENT,
                },
            });

            await tx.business.update({
                where: { id: invoice.businessId },
                data: {
                    subscriptionStatus: SubscriptionStatus.AWAITING_PAYMENT,
                },
            });

            return tx.subscriptionInvoice.findUnique({
                where: { id: invoiceId },
                include: subscriptionInvoiceInclude,
            });
        });
    }
}
