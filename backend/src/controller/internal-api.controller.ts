import { Request, Response } from 'express';
import { db } from '../config/prisma';
import { PaymentStatus } from '@prisma/client';
import { OrderRepository } from '../repositories/order.repository';
import { getOrderByIdService } from '../service/order.service';
import { asyncHandler } from '../middleware/error.middleware';
import { ResponseUtil } from '../utils/response';

const REMINDER_BEFORE_EXPIRY_MS = 3 * 60 * 1000; // 3 menit

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
        const { orderId } = req.params;

        await db.order.update({
            where: { id: orderId },
            data: { paymentReminderSent: true },
        });
        return ResponseUtil.success(res, { message: 'Reminder status updated successfully' });
    },
);

export const getOrderDetails = asyncHandler(
    async (req: Request, res: Response) => {
        const { orderId } = req.params;
        const order = await getOrderByIdService(orderId);
        if (!order) {
            throw new Error('Order not found');
        }
        return ResponseUtil.success(res, order);
    },
);

export const getOutletQueue = asyncHandler(
    async (req: Request, res: Response) => {
        const { outletId } = req.params;
        const queue = await db.order.findMany({
            where: { outletId, orderStatus: 'PROCESSING' },
            include: { guestCustomer: true },
            orderBy: { createdAt: 'asc' },
        });
        return ResponseUtil.success(res, queue);
    },
);
