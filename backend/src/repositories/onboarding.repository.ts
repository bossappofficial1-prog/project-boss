import { PaymentStatus, SubscriptionPlan, SubscriptionStatus, SubscriptionInvoice } from "@prisma/client";
import { db } from "../config/prisma";

interface CompleteOnboardingParams {
    ownerId: string;
    businessName: string;
    description?: string;
    plan: SubscriptionPlan;
}

export class OnboardingRepository {
    static async completeOnboarding({ ownerId, businessName, description, plan }: CompleteOnboardingParams) {
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + plan.durationDays);

        const status = plan.code === "TRIAL"
            ? SubscriptionStatus.ACTIVE
            : SubscriptionStatus.AWAITING_PAYMENT;

        return db.$transaction(async (tx) => {
            const business = await tx.business.create({
                data: {
                    name: businessName,
                    description: description || null,
                    ownerId,
                    subscriptionPlan: plan.code,
                    subscriptionStatus: status,
                    subscriptionStartDate: startDate,
                    subscriptionEndDate: endDate,
                },
            });

            const subscription = await tx.businessSubscription.create({
                data: {
                    businessId: business.id,
                    planId: plan.id,
                    status,
                    startDate,
                    endDate,
                },
            });

            const updatedBusiness = await tx.business.update({
                where: { id: business.id },
                data: { currentSubscriptionId: subscription.id },
            });

            let invoice: SubscriptionInvoice | null = null;
            if (plan.code !== "TRIAL") {
                invoice = await tx.subscriptionInvoice.create({
                    data: {
                        invoiceNumber: this.generateInvoiceNumber(business.id),
                        amount: plan.price,
                        status: PaymentStatus.PENDING,
                        businessId: business.id,
                        subscriptionId: subscription.id,
                    },
                });
            }

            return {
                business: updatedBusiness,
                subscription,
                invoice,
            };
        });
    }

    private static generateInvoiceNumber(businessId: string) {
        const shortId = businessId.replace(/-/g, "").slice(0, 6).toUpperCase();
        return `INV-${shortId}-${Date.now()}`;
    }
}
