import { config } from "../configs/config";
import { db } from "../configs/database";
import { FEES } from "../configs/midtrans";
import { AppError } from "../errors/api_errors";
import { initiateMidtransPayment } from "./pay.service";
import { getUserById } from "./user.service";

interface OrderItemInput {
    productId: string;
    quantity: number;
}

type FeeBearerType = 'CUSTOMER' | 'OWNER';

export async function getOrderById(id: string) {
    const order = await db.order.findUnique({
        where: { id }
    })

    if (!order) throw new AppError("")

    return order
}

export async function createOrderService(order: {
    customerId: string,
    outletId: string,
    items: OrderItemInput[],
    bookingDate?: Date
}
) {
    const newOrder = await db.$transaction(async (tx) => {
        const customer = await getUserById(order.customerId)

        const outlet = await tx.outlet.findUnique({
            where: { id: order.outletId },
            include: { business: true }
        })

        if (!outlet) throw new AppError('Outlet not found', 404);

        const feeBearerPrefrence: FeeBearerType = outlet.business.defaultTransactionFeeBearer;

        let totalAmount = 0
        const validatedItems = [];

        for (const item of order.items) {
            const product = await tx.product.findUnique({
                where: { id: item.productId },
                include: { stockEntries: { where: { outletId: order.outletId } } }
            })

            if (!product) throw new AppError("Product not found", 404);

            if (product.type === "GOODS") {
                const stock = product.stockEntries[0];
                if (!stock || stock.quantity < item.quantity) {
                    throw new AppError(`Stok tidak mencukupi untuk produk ${product.name}`, 400)
                }

                const itemTotal = product.price * item.quantity
                totalAmount += itemTotal
                validatedItems.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    priceAtTimeOfOrder: product.price,
                    product: product
                })
            }
        }

        const platformFee = totalAmount * FEES.QRIS
        let finalAmountMidtrans = totalAmount + platformFee
        let bookingAdminFee = 0

        bookingAdminFee = totalAmount * FEES.TRANSACTION

        // Di sini kita fokus pada biaya admin booking 2% aplikasi.
        if (feeBearerPrefrence === "CUSTOMER") {
            finalAmountMidtrans += bookingAdminFee
        }

        const createOrder = await tx.order.create({
            data: {
                customerId: order.customerId,
                outletId: order.outletId,
                totalAmount: totalAmount,
                bookingDate: order.bookingDate,
                paymentStatus: 'PENDING',
                queueStatus: 'AWAITING_PAYMENT',
                items: {
                    createMany: {
                        data: validatedItems.map((item) => ({
                            priceAtTimeOfOrder: item.priceAtTimeOfOrder,
                            productId: item.productId,
                            quantity: item.quantity
                        })),
                        skipDuplicates: true
                    }
                }
            },
            include: {
                items: { select: { quantity: true, productId: true, priceAtTimeOfOrder: true } },
                customer: { select: { name: true, avatar: true } },
                outlet: { select: { name: true, address: true } },
            }
        })

        // // update stok untuk produk type GOODS
        // for (const item of validatedItems) {
        //     if (item.product.type === "GOODS") {
        //         await tx.stock.update({
        //             where: { productId_outletId: { productId: item.productId, outletId: order.outletId } },
        //             data: { quantity: { decrement: item.quantity } }
        //         })
        //     }
        // }

        // buat pembayaran via midtrans
        const midtransItemDetails = validatedItems.map(item => ({
            id: item.productId,
            price: item.priceAtTimeOfOrder,
            quantity: item.quantity,
            name: item.product.name
        }))

        // Tambahkan biaya admin sebagai item terpisah di Midtrans jika dibebankan ke customer
        if (feeBearerPrefrence === "CUSTOMER" && bookingAdminFee > 0) {
            midtransItemDetails.push({
                id: `admin_fee`,
                price: bookingAdminFee,
                quantity: 1,
                name: 'Biaya Admin'
            })
            midtransItemDetails.push({
                id: 'midtrans_fee',
                price: totalAmount * FEES.QRIS,
                name: "Biaya Platform",
                quantity: 1
            })
        }

        const midtransCustomerDetail = {
            first_name: customer.name.split(" ")[0],
            last_name: customer.name.split(" ").slice(1).join(" ") || "",
            email: customer.email
        }

        const midtransResponse = await initiateMidtransPayment(
            createOrder.id, finalAmountMidtrans, midtransItemDetails, midtransCustomerDetail, config.midtrans.MIDTRANS_NOTIFICATION_CALLBACK_URL
        )

        await tx.order.update({
            where: { id: createOrder.id },
            data: {
                midtransTransactionToken: midtransResponse.token,
                midtransRedirectUrl: midtransResponse.redirectUrl
            }
        })

        await tx.transaction.create({
            data: {
                orderId: createOrder.id,
                amount: (finalAmountMidtrans),
                status: 'CREATED',
                fee: 0,
                adminFee: bookingAdminFee,
                feePaidBy: feeBearerPrefrence
            }
        })

        return {
            ...createOrder,
            midtransPayment: midtransResponse
        }
    })

    return newOrder
}