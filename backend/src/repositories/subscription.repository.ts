import { db } from "../config/prisma";
import { SubscriptionStatus } from "@prisma/client";

export class SubscriptionRepository {
    /**
     * Create a new business subscription
     */
    static async createSubscription(data: {
        businessId: string;
        planId: string;
        startDate: Date;
        endDate: Date;
        status: SubscriptionStatus;
        autoRenew?: boolean;
    }) {
        return db.businessSubscription.create({
            data: {
                businessId: data.businessId,
                planId: data.planId,
                startDate: data.startDate,
                endDate: data.endDate,
                status: data.status,
                autoRenew: data.autoRenew ?? true,
            },
        });
    }

    /**
     * Create subscription invoice
     */
    static async createInvoice(data: {
        invoiceNumber: string;
        amount: number;
        businessId: string;
        subscriptionId: string;
        paymentUrl?: string;
        externalId?: string;
    }) {
        return db.subscriptionInvoice.create({
            data: {
                invoiceNumber: data.invoiceNumber,
                amount: data.amount,
                status: "PENDING",
                businessId: data.businessId,
                subscriptionId: data.subscriptionId,
                paymentUrl: data.paymentUrl,
                externalId: data.externalId,
            },
        });
    }

    /**
     * Get active subscription for a business
     */
    static async getActiveSubscription(businessId: string) {
        return db.businessSubscription.findFirst({
            where: {
                businessId,
                status: "ACTIVE",
            },
            include: {
                plan: true,
            },
        });
    }

    /**
     * Get subscription by ID
     */
    static async getById(subscriptionId: string) {
        return db.businessSubscription.findUnique({
            where: { id: subscriptionId },
            include: {
                plan: true,
                business: true,
            },
        });
    }

    /**
     * Update subscription status
     */
    static async updateStatus(subscriptionId: string, status: SubscriptionStatus) {
        return db.businessSubscription.update({
            where: { id: subscriptionId },
            data: { status },
        });
    }

    /**
     * Get invoice by ID
     */
    static async getInvoiceById(invoiceId: string) {
        return db.subscriptionInvoice.findUnique({
            where: { id: invoiceId },
            include: {
                subscription: {
                    include: {
                        plan: true,
                    },
                },
                business: true,
            },
        });
    }

    /**
     * Update invoice status
     */
    static async updateInvoiceStatus(invoiceId: string, status: string) {
        return db.subscriptionInvoice.update({
            where: { id: invoiceId },
            data: { 
                status: status as any,
                ...(status === "SUCCESS" && { paidAt: new Date() }),
            },
        });
    }

    /**
     * Get invoices for a business
     */
    static async getInvoicesByBusinessId(businessId: string) {
        return db.subscriptionInvoice.findMany({
            where: { businessId },
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

    /**
     * Get plan by code
     */
    static async getPlanByCode(code: string) {
        return db.subscriptionPlan.findUnique({
            where: { code },
        });
    }

    /**
     * Get expiring subscriptions (within next N days)
     */
    static async getExpiringSubscriptions(daysFromNow: number) {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(now.getDate() + daysFromNow);

        return db.businessSubscription.findMany({
            where: {
                status: "ACTIVE",
                endDate: {
                    gte: now,
                    lte: futureDate,
                },
            },
            include: {
                business: {
                    include: {
                        owner: true,
                    },
                },
                plan: true,
            },
        });
    }

    /**
     * Get expired subscriptions
     */
    static async getExpiredSubscriptions() {
        const now = new Date();

        return db.businessSubscription.findMany({
            where: {
                status: "ACTIVE",
                endDate: {
                    lt: now,
                },
            },
            include: {
                business: true,
            },
        });
    }
}
