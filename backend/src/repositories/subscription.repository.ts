import { PaymentStatus, SubscriptionStatus } from "@prisma/client";
import { db } from "../config/prisma";

export class SubscriptionRepository {
    static async getInvoiceWithPlan(invoiceId: string) {
        return db.subscriptionInvoice.findUnique({
            where: { id: invoiceId },
            include: {
                subscription: {
                    include: {
                        plan: true,
                        business: true,
                    },
                },
            },
        });
    }

    static async submitPaymentProof(params: {
        invoiceId: string;
        subscriptionId: string;
        businessId: string;
        proofUrl: string;
    }) {
        const { invoiceId, subscriptionId, businessId, proofUrl } = params;

        return db.$transaction(async (tx) => {
            const updatedInvoice = await tx.subscriptionInvoice.update({
                where: { id: invoiceId },
                data: {
                    proofImage: proofUrl,
                    proofUploadedAt: new Date(),
                    status: PaymentStatus.PROOF_SUBMITTED,
                },
            });

            const updatedSubscription = await tx.businessSubscription.update({
                where: { id: subscriptionId },
                data: {
                    status: SubscriptionStatus.PROOF_SUBMITTED,
                },
            });

            const updatedBusiness = await tx.business.update({
                where: { id: businessId },
                data: {
                    subscriptionStatus: SubscriptionStatus.PROOF_SUBMITTED,
                },
            });

            return {
                invoice: updatedInvoice,
                subscription: updatedSubscription,
                business: updatedBusiness,
            };
        });
    }

    static async getBusinessWithCurrentSubscription(businessId: string) {
        return db.business.findUnique({
            where: { id: businessId },
            include: {
                currentSubscription: {
                    include: {
                        plan: true,
                        invoices: {
                            orderBy: { createdAt: "desc" },
                            take: 1,
                        },
                    },
                },
            },
        });
    }

    static async getLatestPendingInvoice(businessId: string) {
        return db.subscriptionInvoice.findFirst({
            where: {
                businessId,
                status: {
                    in: [PaymentStatus.PENDING, PaymentStatus.PROOF_SUBMITTED],
                },
            },
            include: {
                subscription: {
                    include: {
                        plan: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    static async listInvoicesByBusiness(
        businessId: string,
        options: { page?: number; limit?: number } = {},
    ) {
        const page = Math.max(options.page ?? 1, 1);
        const limit = Math.min(Math.max(options.limit ?? 10, 1), 50);
        const skip = (page - 1) * limit;

        const [total, invoices] = await db.$transaction([
            db.subscriptionInvoice.count({ where: { businessId } }),
            db.subscriptionInvoice.findMany({
                where: { businessId },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    subscription: {
                        include: {
                            plan: true,
                        },
                    },
                },
            }),
        ]);

        return {
            data: invoices,
            total,
            page,
            limit,
            totalPages: Math.max(Math.ceil(total / limit), 1),
        };
    }

    static async createRenewalSubscription(params: {
        businessId: string;
        planId: string;
        price: number;
        startDate: Date;
        endDate: Date;
    }) {
        const { businessId, planId, price, startDate, endDate } = params;

        return db.$transaction(async (tx) => {
            const subscription = await tx.businessSubscription.create({
                data: {
                    businessId,
                    planId,
                    status: SubscriptionStatus.AWAITING_PAYMENT,
                    startDate,
                    endDate,
                },
                include: {
                    plan: true,
                },
            });

            const invoice = await tx.subscriptionInvoice.create({
                data: {
                    invoiceNumber: this.generateInvoiceNumber(businessId),
                    amount: price,
                    status: PaymentStatus.PENDING,
                    businessId,
                    subscriptionId: subscription.id,
                },
                include: {
                    subscription: {
                        include: {
                            plan: true,
                        },
                    },
                },
            });

            return { subscription, invoice };
        });
    }

    private static generateInvoiceNumber(businessId: string) {
        const shortId = businessId.replace(/-/g, "").slice(0, 6).toUpperCase();
        return `INV-${shortId}-${Date.now()}`;
    }
}
