import { FeeBearer, ManualPaymentType, OrderStatus, PaymentStatus } from '@prisma/client';
import { coreApi } from '../config/midtrans';
import { db } from '../config/prisma';
import { AppError } from '../errors/app-error';
import { HttpStatus } from '../constants/http-status';
import { Messages } from '../constants/message';
import { CreatePosOrderInput } from '../schemas/pos-order.schema';
import { CreateOrderInput, OnlinePaymentChannel } from '../schemas/order.schema';
import { createOrderRecord } from './helpers/order-create.helper';
import { OrderRepository } from '../repositories/order.repository';
import { buildMidtransCorePayload, normalizeMidtransCoreResponse } from '../utils/midtrans-core.utils';
import { MidtransItem } from '../types/Others';
import { mappingTransactionStatusForMidtrans } from '../utils/mapping';
import { ManualPaymentRepository } from '../repositories/manual-payment.repository';
import { socketUtils } from '../utils/socket.utils';
import { schedulePaymentExpiration } from '../queues/payment.queue';
import { SocketEmitter } from '../socket/socket-emiiter';

// Tipe utilitas internal

type OrderWithRelations = NonNullable<Awaited<ReturnType<typeof OrderRepository.findById>>>;

type MidtransCoreDetail = ReturnType<typeof normalizeMidtransCoreResponse>;

export interface PosOrderTransactionSummary {
    id: string;
    status: PaymentStatus;
    isManual: boolean;
    paymentMethod: 'cash' | 'qris' | 'online' | 'manual_transfer';
    paymentUrl?: string | null;
    midtrans?: MidtransCoreDetail | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreatePosOrderResult {
    order: OrderWithRelations;
    transaction: PosOrderTransactionSummary;
}

function assertOrder(order: Awaited<ReturnType<typeof OrderRepository.findById>> | null): OrderWithRelations {
    if (!order) {
        throw new AppError(Messages.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return order;
}

function buildItemDetails(order: OrderWithRelations, midtransFee: number, appFee: number, feeBearer: FeeBearer): MidtransItem[] {
    const items: MidtransItem[] = order.items.map((item) => ({
        id: item.productId,
        name: item.product.name,
        price: Math.round(item.priceAtTimeOfOrder),
        quantity: item.quantity,
    }));

    if (feeBearer === 'CUSTOMER' && midtransFee > 0) {
        items.push({
            id: 'midtrans_fee',
            name: 'Biaya Admin Midtrans',
            price: Math.round(midtransFee),
            quantity: 1,
        });
    }

    if (feeBearer === 'CUSTOMER' && appFee > 0) {
        items.push({
            id: 'app_fee',
            name: 'Biaya Aplikasi BOSS',
            price: Math.round(appFee),
            quantity: 1,
        });
    }

    return items;
}

function resolveActionUrl(actions?: Array<{ name: string; url: string }>): string | undefined {
    if (!actions?.length) return undefined;
    const candidates = ['deeplink-redirect', 'app-redirect', 'gopay-qris', 'gopay-wallet', 'qris-url', 'generate-qr-code'];
    for (const candidate of candidates) {
        const action = actions.find((item) => item.name === candidate);
        if (action?.url) {
            return action.url;
        }
    }
    return undefined;
}

async function fetchOrder(orderId: string): Promise<OrderWithRelations> {
    const order = await OrderRepository.findById(orderId);
    return assertOrder(order);
}

export async function createPosOrderService(input: CreatePosOrderInput): Promise<CreatePosOrderResult> {
    const orderPayload: CreateOrderInput = {
        guestCustomer: input.guestCustomer,
        outletId: input.outletId,
        items: input.items,
        bookingDate: input.bookingDate,
        bookingSlotId: input.bookingSlotId,
        paymentMethod: input.paymentMethod,
        onlinePaymentChannel: input.onlinePaymentChannel,
        orderSource: 'POS',
    };

    if (input.paymentMethod === 'cash') {
        return handleCashOrder(orderPayload);
    }

    if (input.paymentMethod === 'qris') {
        return handleManualQrisOrder(orderPayload);
    }

    if (input.paymentMethod === 'online') {
        if (!input.onlinePaymentChannel) {
            throw new AppError(Messages.PAYMENT_METHOD_NOT_SUPPORTED, HttpStatus.BAD_REQUEST);
        }
        return handleOnlineOrder(orderPayload, input.onlinePaymentChannel);
    }

    throw new AppError(Messages.PAYMENT_METHOD_NOT_SUPPORTED, HttpStatus.BAD_REQUEST);
}

async function handleCashOrder(orderPayload: CreateOrderInput): Promise<CreatePosOrderResult> {
    const { order } = await createOrderRecord(orderPayload);

    await db.order.update({
        where: { id: order.id },
        data: {
            paymentStatus: PaymentStatus.SUCCESS,
            orderStatus: OrderStatus.PROCESSING,
        },
    });

    const orderWithRelations = await fetchOrder(order.id);
    const now = new Date();

    const transaction = await ManualPaymentRepository.createManualTransaction({
        amount: orderWithRelations.totalAmount,
        paymentMethod: 'cash',
        status: PaymentStatus.SUCCESS,
        isManual: true,
        manualMethod: ManualPaymentType.CASH,
        order: {
            connect: {
                id: order.id,
            },
        },
    });

    try {
        SocketEmitter.getInstance().emitToBusinessOutlet(orderWithRelations.outletId, {
            orderId: order.id,
            amount: orderWithRelations.totalAmount,
            customerName: orderWithRelations.guestCustomer.name,
            paymentMethod: orderWithRelations.transaction?.paymentMethod!,
            timestamp: new Date()
        })
    } catch (error) {
        console.error('❌ Error emitting POS cash payment event:', error);
    }

    return {
        order: orderWithRelations,
        transaction: {
            id: `cash-${order.id}`,
            status: PaymentStatus.SUCCESS,
            isManual: false,
            paymentMethod: 'cash',
            paymentUrl: null,
            midtrans: null,
            createdAt: now,
        },
    };
}

async function handleManualQrisOrder(orderPayload: CreateOrderInput): Promise<CreatePosOrderResult> {
    const { order, totalAmount } = await createOrderRecord(orderPayload);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const transaction = await ManualPaymentRepository.createManualTransaction({
        amount: totalAmount,
        paymentMethod: 'qris',
        status: PaymentStatus.SUCCESS,
        isManual: true,
        manualMethod: ManualPaymentType.QRIS_OFFLINE,
        expiresAt,
        order: {
            connect: {
                id: order.id,
            },
        },
    });

    const orderWithRelations = await fetchOrder(order.id);

    try {
        SocketEmitter.getInstance().emitToBusinessOutlet(orderWithRelations.outletId, {
            orderId: order.id,
            amount: orderWithRelations.totalAmount,
            customerName: orderWithRelations.guestCustomer.name,
            paymentMethod: orderWithRelations.transaction?.paymentMethod!,
            timestamp: new Date()
        })
    } catch (error) {
        console.error('❌ Error emitting manual QRIS payment event:', error);
    }

    return {
        order: orderWithRelations,
        transaction: {
            id: transaction.id,
            status: transaction.status,
            isManual: true,
            paymentMethod: 'qris',
            paymentUrl: transaction.paymentUrl ?? null,
            midtrans: null,
            createdAt: transaction.createdAt,
        },
    };
}

async function handleOnlineOrder(orderPayload: CreateOrderInput, channel: OnlinePaymentChannel): Promise<CreatePosOrderResult> {
    const { order, midtransFee, appFee, feeBearer, totalAmount } = await createOrderRecord(orderPayload);

    const orderForItems = await fetchOrder(order.id);
    const itemDetails = buildItemDetails(orderForItems, midtransFee, appFee, feeBearer);

    try {
        const payload = buildMidtransCorePayload({
            orderId: order.id,
            grossAmount: Math.round(totalAmount),
            itemDetails,
            customer: {
                name: orderForItems.guestCustomer.name,
                phone: orderForItems.guestCustomer.phone!,
            },
            channel,
        });

        const midtransResponse = await coreApi.charge(payload) as Record<string, any>;
        const paymentUrl = resolveActionUrl(midtransResponse.actions);
        const expiresAt = midtransResponse.expiry_time
            ? new Date(midtransResponse.expiry_time)
            : new Date(Date.now() + 15 * 60 * 1000);

        const transaction = await db.transaction.create({
            data: {
                id: midtransResponse.transaction_id,
                externalId: midtransResponse.transaction_id,
                amount: Number(midtransResponse.gross_amount),
                paymentMethod: midtransResponse.payment_type,
                status: mappingTransactionStatusForMidtrans(midtransResponse.transaction_status),
                paymentUrl: paymentUrl ?? null,
                expiresAt,
                orderId: order.id,
            },
        });

        await schedulePaymentExpiration(order.id, expiresAt);

        await db.order.update({
            where: { id: order.id },
            data: {
                paymentStatus: PaymentStatus.PENDING,
                orderStatus: OrderStatus.AWAITING_PAYMENT,
            },
        });

        const refreshedOrder = await fetchOrder(order.id);
        const midtransDetail = normalizeMidtransCoreResponse(midtransResponse, channel);

        try {
            SocketEmitter.getInstance().emitToBusinessOutlet(refreshedOrder.outletId, {
                orderId: order.id,
                amount: refreshedOrder.totalAmount,
                customerName: refreshedOrder.guestCustomer.name,
                paymentMethod: refreshedOrder.transaction?.paymentMethod!,
                timestamp: new Date()
            })
        } catch (error) {
            console.error('❌ Error emitting POS online payment event:', error);
        }

        return {
            order: refreshedOrder,
            transaction: {
                id: transaction.id,
                status: transaction.status,
                isManual: transaction.isManual,
                paymentMethod: 'online',
                paymentUrl: transaction.paymentUrl,
                midtrans: midtransDetail,
                createdAt: transaction.createdAt,
            },
        };
    } catch (error) {
        await db.order.delete({ where: { id: order.id } });
        throw error;
    }
}
