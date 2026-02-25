import { HttpStatus } from "../constants/http-status";
import { AppError } from "../errors/app-error";
import { BusinessRepository } from "../repositories/business.repository";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { CompleteOnboardingInput } from "../schemas/onboarding.schema";
import { nanoid } from "nanoid";

export class OnboardingService {
    /**
     * Complete onboarding process: create business, subscription, and invoice
     */
    static async completeOnboarding(userId: string, data: CompleteOnboardingInput) {
        // Check if user already has a business
        const existingBusiness = await BusinessRepository.findByOwnerId(userId);
        if (existingBusiness) {
            throw new AppError("Anda sudah memiliki bisnis.", HttpStatus.CONFLICT);
        }

        // Get subscription plan
        const plan = await SubscriptionRepository.getPlanByCode(data.selectedPlan);
        if (!plan) {
            throw new AppError("Plan tidak ditemukan.", HttpStatus.NOT_FOUND);
        }

        // Calculate subscription dates
        const now = new Date();
        const endDate = new Date(now);
        endDate.setDate(now.getDate() + plan.durationDays);

        // Create business
        const business = await BusinessRepository.create(
            {
                name: data.businessName,
                description: data.description,
            } as any,
            userId
        );

        // Create subscription
        const subscription = await SubscriptionRepository.createSubscription({
            businessId: business.id,
            planId: plan.id,
            startDate: now,
            endDate: endDate,
            status: data.selectedPlan === "TRIAL" ? "TRIAL" : "AWAITING_PAYMENT",
            autoRenew: true,
        });

        // Update business with subscription info
        await BusinessRepository.update(business.id, {
            currentSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            subscriptionStartDate: now,
            subscriptionEndDate: endDate,
            subscriptionPlan: plan.code,
        });

        let invoice = null;

        // Create invoice if not TRIAL
        if (data.selectedPlan !== "TRIAL") {
            const invoiceNumber = `INV-${nanoid(10).toUpperCase()}`;
            invoice = await SubscriptionRepository.createInvoice({
                invoiceNumber,
                amount: plan.price,
                businessId: business.id,
                subscriptionId: subscription.id,
            });
        } else {
            // For TRIAL, activate immediately
            await SubscriptionRepository.updateStatus(subscription.id, "ACTIVE");
            await BusinessRepository.update(business.id, {
                subscriptionStatus: "ACTIVE",
            });
        }

        return {
            business,
            subscription,
            invoice,
            plan,
        };
    }

    /**
     * Renew subscription for a business
     */
    static async renewSubscription(businessId: string, planCode?: string) {
        const business = await BusinessRepository.findById(businessId);
        if (!business) {
            throw new AppError("Bisnis tidak ditemukan.", HttpStatus.NOT_FOUND);
        }

        // Get current or specified plan
        let plan;
        if (planCode) {
            plan = await SubscriptionRepository.getPlanByCode(planCode);
        } else {
            // Use current plan
            plan = await SubscriptionRepository.getPlanByCode(business.subscriptionPlan);
        }

        if (!plan) {
            throw new AppError("Plan tidak ditemukan.", HttpStatus.NOT_FOUND);
        }

        // Calculate new subscription dates
        const now = new Date();
        const currentEndDate = business.subscriptionEndDate || now;
        
        // If current subscription is still active, extend from end date
        // Otherwise, start from now
        const startDate = currentEndDate > now ? currentEndDate : now;
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + plan.durationDays);

        // Create new subscription
        const subscription = await SubscriptionRepository.createSubscription({
            businessId: business.id,
            planId: plan.id,
            startDate: startDate,
            endDate: endDate,
            status: plan.code === "TRIAL" ? "TRIAL" : "AWAITING_PAYMENT",
            autoRenew: true,
        });

        let invoice = null;

        // Create invoice if not TRIAL
        if (plan.code !== "TRIAL") {
            const invoiceNumber = `INV-${nanoid(10).toUpperCase()}`;
            invoice = await SubscriptionRepository.createInvoice({
                invoiceNumber,
                amount: plan.price,
                businessId: business.id,
                subscriptionId: subscription.id,
            });
        }

        return {
            subscription,
            invoice,
            plan,
        };
    }

    /**
     * Activate subscription after payment
     */
    static async activateSubscription(invoiceId: string) {
        const invoice = await SubscriptionRepository.getInvoiceById(invoiceId);
        if (!invoice) {
            throw new AppError("Invoice tidak ditemukan.", HttpStatus.NOT_FOUND);
        }

        if (invoice.status === "SUCCESS") {
            throw new AppError("Invoice sudah dibayar.", HttpStatus.BAD_REQUEST);
        }

        // Update invoice status
        await SubscriptionRepository.updateInvoiceStatus(invoiceId, "SUCCESS");

        // Activate subscription
        await SubscriptionRepository.updateStatus(invoice.subscriptionId, "ACTIVE");

        // Update business
        await BusinessRepository.update(invoice.businessId, {
            currentSubscriptionId: invoice.subscriptionId,
            subscriptionStatus: "ACTIVE",
            subscriptionStartDate: invoice.subscription.startDate,
            subscriptionEndDate: invoice.subscription.endDate,
            subscriptionPlan: invoice.subscription.plan.code,
        });

        return {
            invoice,
            subscription: invoice.subscription,
        };
    }

    /**
     * Get subscription status for a business
     */
    static async getSubscriptionStatus(businessId: string) {
        const business = await BusinessRepository.findById(businessId);
        if (!business) {
            throw new AppError("Bisnis tidak ditemukan.", HttpStatus.NOT_FOUND);
        }

        const subscription = business.currentSubscriptionId
            ? await SubscriptionRepository.getById(business.currentSubscriptionId)
            : null;

        const invoices = await SubscriptionRepository.getInvoicesByBusinessId(businessId);

        return {
            business,
            subscription,
            invoices,
        };
    }
}
