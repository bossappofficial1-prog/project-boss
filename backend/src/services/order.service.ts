import { db } from "../configs/database";
import { AppError } from "../errors/api_errors";

interface OrderItemInput {
    productId: string;
    quantity: number;
}
export async function createOrderService(order: {
    customerId: string;
    outletId: string;
    items: OrderItemInput[];
    bookingDate?: Date;
    paymentMethod: string;
    feePaidBy?: 'CUSTOMER' | 'OWNER';
}) {
    const orders = await db.$transaction(async (tx) => {
        // cek customer
        const customer = await tx.user.findUnique({
            where: { id: order.customerId }
        })

        if (!customer) throw new AppError("customer not found", 404);

        // cek outlet
        const outlet = await tx.outlet.findUnique({
            where: { id: order.outletId },
            include: { business: true }
        })

        if (!outlet) throw new AppError("outlet not found", 404);

        let totalAmount = 0
        const validatedItems = []

        for (const item of order.items) {
            const product = await tx.product.findUnique({
                where: { id: item.productId },
                include: {
                    stockEntries: {
                        where: { outletId: order.outletId }
                    }
                }
            })

            if (!product) {
                throw new AppError(`Produk dengan ID ${item.productId} tidak ditemukan`, 404);
            }

            // Cek stok untuk produk GOODS
            if (product.type === 'GOODS') {
                const stock = product.stockEntries[0];
                if (!stock || stock.quantity < item.quantity) {
                    throw new Error(`Stok tidak mencukupi untuk produk ${product.name}`);
                }
            }

            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal;

            validatedItems.push({
                productId: item.productId,
                quantity: item.quantity,
                priceAtTimeOfOrder: product.price,
                product: product
            });
        }

        // Buat order
        const orders = await tx.order.create({
            data: {
                customerId: order.customerId,
                outletId: order.outletId,
                totalAmount: Math.round(totalAmount),
                bookingDate: order.bookingDate,
                items: {
                    create: validatedItems.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        priceAtTimeOfOrder: item.priceAtTimeOfOrder
                    }))
                }
            },
            include: {
                items: {
                    include: { product: true }
                },
                customer: true,
                outlet: {
                    include: { business: true }
                }
            }
        });

        // update stok untuk produk goods
        for (const item of validatedItems) {
            if (item.product.type === "GOODS") {
                await tx.stock.update({
                    where: {
                        productId_outletId: {
                            productId: item.productId,
                            outletId: order.outletId
                        }
                    },
                    data: {
                        quantity: {
                            decrement: item.quantity
                        }
                    }
                })
            }
        }

        return orders
    })

    return orders
}