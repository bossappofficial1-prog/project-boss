import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { SubscriptionRepository } from "../repositories/subscription.repository";
import { PaymentStatus } from "@prisma/client";
import { PlanLimitService } from "./plan-limit.service";
import { SubscriptionPlanRepository } from "../repositories/subscription-plan.repository";
import { RenewSubscriptionInput, SwitchBillingCycleInput } from "../schemas/subscription.schema";
import { EmailService } from "./email.service";
import { db } from "../config/prisma";

export class SubscriptionService {
    static calculateEffectiveYearlyPrice(plan: { yearlyPrice: number; yearlyDiscount: number }): number {
        if (plan.yearlyDiscount <= 0) return plan.yearlyPrice;
        return plan.yearlyPrice * (1 - plan.yearlyDiscount / 100);
    }

    static async uploadPaymentProof(businessId: string, invoiceId: string, proofUrl: string) {
        const invoice = await SubscriptionRepository.getInvoiceWithPlan(invoiceId);

        if (!invoice) {
            throw new AppError('Invoice tidak ditemukan', HttpStatus.NOT_FOUND);
        }

        if (invoice.subscription?.business.id !== businessId) {
            throw new AppError('Invoice tidak milik bisnis Anda', HttpStatus.FORBIDDEN);
        }

        if (invoice.status === PaymentStatus.SUCCESS) {
            throw new AppError('Invoice ini sudah dibayar', HttpStatus.BAD_REQUEST);
        }

        if (invoice.status === PaymentStatus.PROOF_SUBMITTED) {
            throw new AppError('Bukti pembayaran sudah dikirim, menunggu verifikasi', HttpStatus.BAD_REQUEST);
        }

        const result = await SubscriptionRepository.submitPaymentProof({
            invoiceId,
            subscriptionId: invoice.subscriptionId || `default`,
            businessId,
            proofUrl,
        });

        return {
            invoice: result.invoice,
            subscription: result.subscription,
        };
    }

    static async getInvoiceDetail(businessId: string, invoiceId: string) {
        const invoice = await SubscriptionRepository.getInvoiceWithPlan(invoiceId);

        if (!invoice) {
            throw new AppError('Invoice tidak ditemukan', HttpStatus.NOT_FOUND);
        }

        if (invoice.subscription?.business.id !== businessId) {
            throw new AppError('Invoice tidak milik bisnis Anda', HttpStatus.FORBIDDEN);
        }

        return {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.amount,
            status: invoice.status,
            businessId: invoice.businessId,
            subscriptionId: invoice.subscriptionId,
            createdAt: invoice.createdAt,
            rejectionReason: invoice.rejectionReason,
            proofImage: invoice.proofImage,
            plan: invoice.subscription.plan,
            billingCycle: invoice.subscription.billingCycle,
        };
    }

    static async getSubscriptionStatus(businessId: string) {
        const business = await SubscriptionRepository.getBusinessWithCurrentSubscription(businessId);

        if (!business) {
            throw new AppError('Bisnis tidak ditemukan', HttpStatus.NOT_FOUND);
        }

        const pendingInvoice = business.currentSubscription?.invoices[0] ?? null;

        return {
            business: {
                id: business.id,
                name: business.name,
                subscriptionStatus: business.subscriptionStatus,
                subscriptionEndDate: business.subscriptionEndDate,
                subscriptionPlan: business.subscriptionPlan,
            },
            subscription: business.currentSubscription,
            pendingInvoice,
        };
    }

    static async getOwnerSubscriptionOverview(businessId: string) {
        const business = await SubscriptionRepository.getBusinessWithCurrentSubscription(businessId);

        if (!business) {
            throw new AppError('Bisnis tidak ditemukan', HttpStatus.NOT_FOUND);
        }

        const usage = await PlanLimitService.getUsageSnapshot(businessId, { allowInactive: true });
        const pendingInvoice = await SubscriptionRepository.getLatestPendingInvoice(businessId);

        return {
            business: {
                id: business.id,
                name: business.name,
                subscriptionStatus: business.subscriptionStatus,
                subscriptionStartDate: business.subscriptionStartDate,
                subscriptionEndDate: business.subscriptionEndDate,
            },
            plan: business.currentSubscription?.plan ?? null,
            usage,
            pendingInvoice: pendingInvoice
                ? {
                    id: pendingInvoice.id,
                    invoiceNumber: pendingInvoice.invoiceNumber,
                    amount: pendingInvoice.amount,
                    status: pendingInvoice.status,
                    createdAt: pendingInvoice.createdAt,
                    subscriptionId: pendingInvoice.subscriptionId,
                    rejectionReason: pendingInvoice.rejectionReason,
                    proofImage: pendingInvoice.proofImage,
                    plan: pendingInvoice.subscription?.plan,
                }
                : null,
        };
    }

    static async listInvoices(businessId: string, options: { page?: number; limit?: number }) {
        const result = await SubscriptionRepository.listInvoicesByBusiness(businessId, options);
        const simplified = result.data.map((invoice) => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.amount,
            status: invoice.status,
            createdAt: invoice.createdAt,
            paidAt: invoice.paidAt,
            subscriptionId: invoice.subscriptionId,
            plan: invoice.subscription?.plan,
            subscription: invoice.subscription ? {
                billingCycle: invoice.subscription.billingCycle,
            } : null,
        }));

        return {
            data: simplified,
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        };
    }

    static async renewSubscription(businessId: string, payload: RenewSubscriptionInput) {
        const business = await SubscriptionRepository.getBusinessWithCurrentSubscription(businessId);

        if (!business) {
            throw new AppError('Bisnis tidak ditemukan', HttpStatus.NOT_FOUND);
        }

        const hasUsedTrial = await SubscriptionRepository.hasUsedTrial(businessId);

        const pendingInvoice = await SubscriptionRepository.getLatestPendingInvoice(businessId);
        if (pendingInvoice && [PaymentStatus.PENDING, PaymentStatus.PROOF_SUBMITTED].includes(pendingInvoice.status as any)) {
            throw new AppError('Masih ada invoice menunggu pembayaran. Selesaikan proses sebelumnya terlebih dahulu.', HttpStatus.BAD_REQUEST);
        }

        let targetPlan = business.currentSubscription?.plan || null;

        if (payload.planCode) {
            const requestedPlan = await SubscriptionPlanRepository.getByCode(payload.planCode);
            if (!requestedPlan) {
                throw new AppError('Paket langganan tidak ditemukan', HttpStatus.NOT_FOUND);
            }
            if (!requestedPlan.isActive) {
                throw new AppError('Paket langganan tidak aktif', HttpStatus.BAD_REQUEST);
            }
            targetPlan = requestedPlan;
        }

        if (targetPlan?.code === "TRIAL") {
            throw new AppError(
                hasUsedTrial
                    ? 'Paket trial hanya bisa digunakan satu kali. Pilih paket berbayar untuk melanjutkan.'
                    : 'Tidak dapat memperpanjang paket trial. Pilih paket berbayar untuk melanjutkan.',
                HttpStatus.BAD_REQUEST,
            );
        }

        if (!targetPlan) {
            throw new AppError('Paket langganan tidak tersedia untuk bisnis Anda', HttpStatus.BAD_REQUEST);
        }

        const billingCycle = payload.billingCycle ?? 30;
        const now = new Date();
        const currentEnd = business.subscriptionEndDate ? new Date(business.subscriptionEndDate) : null;
        const startDate = currentEnd && currentEnd > now ? currentEnd : now;
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (billingCycle === 365 ? 365 : 30));

        const pricePerCycle = billingCycle === 365
            ? this.calculateEffectiveYearlyPrice(targetPlan)
            : (targetPlan.promo ? Number(targetPlan.promo) : targetPlan.price);

        const renewal = await SubscriptionRepository.createRenewalSubscription({
            businessId,
            planId: targetPlan.id,
            price: pricePerCycle,
            startDate,
            endDate,
            billingCycle,
            pricePerCycle,
        });

        return renewal;
    }

    static async switchBillingCycle(businessId: string, payload: SwitchBillingCycleInput) {
        const business = await SubscriptionRepository.getBusinessWithCurrentSubscription(businessId);

        if (!business) {
            throw new AppError('Bisnis tidak ditemukan', HttpStatus.NOT_FOUND);
        }

        if (!business.currentSubscription) {
            throw new AppError('Tidak ada subscription aktif', HttpStatus.BAD_REQUEST);
        }

        const currentSubscription = business.currentSubscription;

        // Cannot switch mid-cycle - must wait until end date
        const now = new Date();
        if (currentSubscription.endDate > now) {
            throw new AppError(
                `Tidak dapat switch billing cycle sebelum periode berakhir (${currentSubscription.endDate.toLocaleDateString('id-ID')}).`,
                HttpStatus.BAD_REQUEST
            );
        }

        if (currentSubscription.billingCycle === payload.billingCycle) {
            throw new AppError('Billing cycle sudah sama', HttpStatus.BAD_REQUEST);
        }

        const plan = currentSubscription.plan;
        const pricePerCycle = payload.billingCycle === 365
            ? this.calculateEffectiveYearlyPrice(plan)
            : (plan.promo ? Number(plan.promo) : plan.price);

        const startDate = now;
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + payload.billingCycle);

        const result = await SubscriptionRepository.switchBillingCycle(
            currentSubscription.id,
            payload.billingCycle,
            pricePerCycle,
            endDate
        );

        // Update business subscription end date
        await db.business.update({
            where: { id: businessId },
            data: {
                subscriptionEndDate: endDate,
            },
        });

        return {
            subscriptionId: result.id,
            previousBillingCycle: currentSubscription.billingCycle,
            newBillingCycle: result.billingCycle,
            pricePerCycle: result.pricePerCycle,
            startDate,
            endDate: result.endDate,
            nextBillingDate: result.nextBillingDate,
        };
    }

    static async cancelInvoice(businessId: string, invoiceId: string) {
        try {
            return await SubscriptionRepository.cancelInvoice(invoiceId, businessId);
        } catch (error: any) {
            throw new AppError('Gagal membatalkan invoice', HttpStatus.BAD_REQUEST);
        }
    }
}
