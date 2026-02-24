import { Request, Response } from 'express';
import { db } from '../config/prisma';
import { PaymentStatus } from '@prisma/client';
import { OrderRepository } from '../repositories/order.repository';
import { getOrderByIdService } from '../service/order.service';
import { asyncHandler } from '../middleware/error.middleware';
import { ResponseUtil } from '../utils/response';
import { handlePaymentSuccess, handlePaymentFailure } from '../service/payment-update.service';
import { ensureString } from '../utils/request';

const REMINDER_BEFORE_EXPIRY_MS = 3 * 60 * 1000; // 1 jam untuk test

export const getExpiringTransactions = asyncHandler(
    async (req: Request, res: Response) => {
        const now = new Date();
        const reminderWindowStart = new Date(now.getTime() + REMINDER_BEFORE_EXPIRY_MS);

        const expiringTransactions = await db.transaction.findMany({
            where: {
                status: PaymentStatus.PENDING,
                expiresAt: {
                    gte: now,
                    lte: reminderWindowStart,
                },
                order: {
                    paymentReminderSent: false,
                },
            },
            include: {
                // Sertakan semua detail yang dibutuhkan oleh NotificationService di consumer
                order: {
                    include: {
                        items: {
                            include: {
                                product: true,
                            },
                        },
                        guestCustomer: true,
                        outlet: true,
                    },
                },
            },
        });

        return ResponseUtil.success(res, expiringTransactions);
    },
);

export const markReminderSent = asyncHandler(
    async (req: Request, res: Response) => {
        const orderId = ensureString(req.params?.orderId, 'orderId');

        await db.order.update({
            where: { id: orderId },
            data: { paymentReminderSent: true },
        });
        return ResponseUtil.success(res, { message: 'Reminder status updated successfully' });
    },
);

export const getOrderDetails = asyncHandler(
    async (req: Request, res: Response) => {
        const orderId = ensureString(req.params?.orderId, 'orderId');

        const order = await getOrderByIdService(orderId);

        if (!order) {
            throw new Error('Order not found');
        }
        return ResponseUtil.success(res, order);
    },
);

export const getOutletQueue = asyncHandler(
    async (req: Request, res: Response) => {
        const outletId = ensureString(req.params?.outletId, 'outletId');
        const queue = await db.order.findMany({
            where: { outletId, orderStatus: 'PROCESSING' },
            include: { guestCustomer: true },
            orderBy: { createdAt: 'asc' },
        });
        return ResponseUtil.success(res, queue);
    },
);

export const updatePaymentStatus = asyncHandler(
    async (req: Request, res: Response) => {
        console.log(req.body);

        const { orderId, paymentStatus } = req.body;

        if (paymentStatus === 'SUCCESS') {
            await handlePaymentSuccess(orderId);
        } else if (paymentStatus === 'FAILED' || paymentStatus === 'EXPIRED' || paymentStatus === 'CANCELLED') {
            await handlePaymentFailure(orderId);
        }

        return ResponseUtil.success(res, { message: `Payment status for order ${orderId} updated.` });
    },
);
