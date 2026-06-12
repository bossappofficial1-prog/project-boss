import { db } from '../config/prisma';
import { SubscriptionStatus, PaymentStatus } from '@prisma/client';

export class AdminSubscriptionRepository {
  async getBusinessSubscription(businessId: string) {
    return db.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        currentSubscription: {
          include: { plan: true },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { plan: true },
        },
        subscriptionInvoices: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
  }

  async getAllPlans() {
    return db.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async changeSubscriptionPlan(businessId: string, planId: string, startDate: Date, endDate: Date) {
    return db.$transaction(async (tx) => {
      // Mark old subscriptions as superseded
      await tx.businessSubscription.updateMany({
        where: {
          businessId,
          status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE'] },
        },
        data: { status: 'SUPERSEDED' as any },
      });

      // Get plan details
      const plan = await tx.subscriptionPlan.findUnique({
        where: { id: planId },
      });
      if (!plan) throw new Error('Plan not found');

      // Create new subscription
      const subscription = await tx.businessSubscription.create({
        data: {
          businessId,
          planId,
          status: 'ACTIVE' as SubscriptionStatus,
          startDate,
          endDate,
          billingCycle: 30,
          pricePerCycle: plan.price,
          nextBillingDate: endDate,
          autoRenew: true,
        },
        include: { plan: true },
      });

      // Update business
      await tx.business.update({
        where: { id: businessId },
        data: {
          subscriptionStatus: 'ACTIVE',
          subscriptionPlan: plan.code,
          subscriptionStartDate: startDate,
          subscriptionEndDate: endDate,
          currentSubscriptionId: subscription.id,
        },
      });

      return subscription;
    });
  }

  async extendSubscription(businessId: string, days: number) {
    return db.$transaction(async (tx) => {
      const business = await tx.business.findUnique({
        where: { id: businessId },
        select: { subscriptionEndDate: true, currentSubscriptionId: true },
      });
      if (!business) throw new Error('Business not found');

      const currentEnd = business.subscriptionEndDate || new Date();
      const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);

      // Update business end date
      await tx.business.update({
        where: { id: businessId },
        data: { subscriptionEndDate: newEnd },
      });

      // Update subscription end date if exists
      if (business.currentSubscriptionId) {
        await tx.businessSubscription.update({
          where: { id: business.currentSubscriptionId },
          data: { endDate: newEnd, nextBillingDate: newEnd },
        });
      }

      return { previousEndDate: currentEnd, newEndDate: newEnd, daysAdded: days };
    });
  }

  async cancelSubscription(businessId: string, reason: string) {
    return db.$transaction(async (tx) => {
      // Mark all active subscriptions as cancelled
      await tx.businessSubscription.updateMany({
        where: {
          businessId,
          status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE'] },
        },
        data: { status: 'CANCELLED' },
      });

      // Update business
      await tx.business.update({
        where: { id: businessId },
        data: {
          subscriptionStatus: 'CANCELLED',
          currentSubscriptionId: null,
        },
      });

      // Reject any pending invoices
      await tx.subscriptionInvoice.updateMany({
        where: {
          businessId,
          status: { in: ['PENDING', 'PROOF_SUBMITTED', 'AWAITING_VERIFICATION'] },
        },
        data: {
          status: 'CANCELLED' as any,
          rejectionReason: `Subscription cancelled by admin: ${reason}`,
        },
      });

      return { message: 'Subscription cancelled' };
    });
  }

  async markAsPaid(businessId: string, invoiceId: string, performedBy: string) {
    return db.$transaction(async (tx) => {
      const invoice = await tx.subscriptionInvoice.findUnique({
        where: { id: invoiceId },
        include: { subscription: { include: { plan: true } } },
      });
      if (!invoice) throw new Error('Invoice not found');

      // Update invoice
      await tx.subscriptionInvoice.update({
        where: { id: invoiceId },
        data: {
          status: 'SUCCESS' as PaymentStatus,
          verifiedAt: new Date(),
          paidAt: new Date(),
        },
      });

      // If there's a subscription, activate it
      if (invoice.subscriptionId && invoice.subscription) {
        const sub = invoice.subscription;
        await tx.businessSubscription.update({
          where: { id: sub.id },
          data: { status: 'ACTIVE' },
        });

        await tx.business.update({
          where: { id: businessId },
          data: {
            subscriptionStatus: 'ACTIVE',
            subscriptionPlan: sub.plan.code,
            subscriptionStartDate: sub.startDate,
            subscriptionEndDate: sub.endDate,
            currentSubscriptionId: sub.id,
          },
        });
      }

      return { message: 'Invoice marked as paid' };
    });
  }
}
