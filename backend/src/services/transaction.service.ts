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
    id: string,
    data: {
        fee?: number,
        paymentMethod: string,
        externalId: string,
        status: typeof VALID_MIDTRANS_STATUSES[number],
    }) {

    const status = () => {
        let status;
        if (data.status === "SETTLEMENT") {
            status = "SUCCESS";
        } else if (data.status === "PENDING") {
            status = "PENDING"
        } else {
            status = "FAILED"
        }

        return status as TransactionStatus
    }
    await getOrderById(id)

    const updatedTransaction = await db.transaction.update({
        where: { orderId: id },
        data: {
            fee: data.fee || 0,
            externalId: data.externalId,
            status: status(),
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
        for (const order of updatedTransaction.order.items) {
            if (order.product.type === "GOODS") {
                await db.stock.update({
                    where: {
                        productId_outletId: {
                            productId: order.product.id,
                            outletId: updatedTransaction.order.outletId
                        }
                    },
                    data: {
                        quantity: { decrement: order.quantity },
                    }
                })
            }
        }
    }

    return updatedTransaction
}