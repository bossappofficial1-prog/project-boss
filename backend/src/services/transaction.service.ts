import { TransactionStatus } from "@prisma/client";
import { db } from "../configs/database";
import { AppError } from "../errors/api_errors";
import { VALID_MIDTRANS_STATUSES } from "../controllers/midtrans.controller";
import { getOrderById } from "./order.service";

export async function getTransactionById(id: string) {
    const transaction = await db.transaction.findUnique({
        where: { id }
    })

    if (!transaction) throw new AppError(`Transaction ${id} not found`, 404)

    return transaction
}

export async function updateTransactionService(
    orderId: string,
    data: {
        fee?: number,
        paymentMethod: string,
        externalId: string,
        status: typeof VALID_MIDTRANS_STATUSES[number],
    }) {

    const mapMidtransStatusToTransactionStatus = () => {
        if (data.status === "SETTLEMENT") return "SUCCESS";
        if (data.status === "PENDING") return "PENDING";
        return "FAILED";
    }

    const result = await db.$transaction(async (tx) => {
        const existingTransaction = await tx.transaction.findUnique({
            where: { orderId },
        })

        if (!existingTransaction) throw new AppError(`Transaction for order ${orderId} not found`, 404)

        // update transaction
        const updatedTransaction = await tx.transaction.update({
            where: { id: existingTransaction.id },
            data: {
                fee: data.fee || 0,
                externalId: data.externalId,
                status: mapMidtransStatusToTransactionStatus(),
                paymentMethod: data.paymentMethod,
                order: {
                    update: {
                        paymentStatus: data.status,
                    }
                }
            },
            include: {
                order: {
                    select: {
                        id: true,
                        queueStatus: true,
                        items: {
                            select: {
                                product: true,
                                quantity: true
                            }
                        },
                        outletId: true,
                    }
                },
            }
        })

        if (data.status === "SETTLEMENT") {
            let hasGoodsItems = false;
            let hasServiceItems = false;

            for (const item of updatedTransaction.order.items) {
                if (item.product.type === "GOODS") {
                    hasGoodsItems = true
                    // update stock product
                    await tx.product.update({
                        where: { id: item.product.id },
                        data: { quantity: { decrement: item.quantity } }
                    })
                } else if (item.product.type === "SERVICE") {
                    hasServiceItems = true
                }
            }

            let finalQueueStatus: typeof updatedTransaction.order.queueStatus;

            if (hasGoodsItems && !hasServiceItems) {
                finalQueueStatus = "READY_FOR_PICKUP"
            } else if (hasGoodsItems && hasServiceItems) {
                finalQueueStatus = "READY_FOR_PICKUP"
            } else if (hasServiceItems && !hasGoodsItems) {
                finalQueueStatus = "IN_QUEUE"
            } else {
                finalQueueStatus = "COMPLETED"
            }

            await tx.order.update({
                where: { id: updatedTransaction.order.id },
                data: { queueStatus: finalQueueStatus }
            })
        } else if (data.status === "EXPIRE" || data.status === "DENY") {
            // todo: buat logika untuk update seperti sebelumnya dengan kondisi sesuai
            await tx.order.update({
                where: { id: updatedTransaction.order.id },
                data: {
                    paymentStatus: data.status,
                    queueStatus: "FAILED_PROCESSING"
                }
            })
        }

        return updatedTransaction
    })

    return result
}