import { FeeBearer, Order, OrderStatus, Product } from "@prisma/client";
import { db } from "../config/prisma";
import { CreateOrderInput } from "../schemas/order.schema";
import { generateOrderCode } from "../utils";

export class OrderRepository {
    static async receiptData(orderId: string) {
        return db.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                createdAt: true,
                totalAmount: true,
                guestCustomer: {
                    select: {
                        name: true
                    }
                },
                handledByStaff: {
                    select: {
                        name: true
                    }
                },
                items: {
                    select: {
                        quantity: true,
                        priceAtTimeOfOrder: true,
                        product: {
                            select: {
                                name: true,
                                type: true,
                                goods: {
                                    select: {
                                        unit: true
                                    }
                                }
                            }
                        }
                    }
                },
                outlet: {
                    select: {
                        name: true,
                        address: true,
                        phone: true,
                        receiptSettings: true
                    }
                }
            }
        })
    }

    static async create(data: CreateOrderInput, outlet: any, totalAmount: number, midtransFee: number, appFee: number, feeBearer: FeeBearer, productDetails: (Product & { orderQuantity: number })[]): Promise<Order> {
        const { guestCustomer, outletId, items, bookingDate } = data;

        return db.$transaction(async (tx) => {
            // 1. Kurangi stok untuk setiap produk GOODS
            for (const product of productDetails) {
                if (product.type === 'GOODS') {
                    await tx.product.update({
                        where: { id: product.id },
                        data: { quantity: { decrement: product.orderQuantity } },
                    });
                }
            }

            // 2. Create or find the guest customer
            let customer = await tx.guestCustomer.findFirst({
                where: { phone: guestCustomer.phone },
            });

            if (!customer) {
                customer = await tx.guestCustomer.create({
                    data: guestCustomer,
                });
            }

            // 3. Create the order
            const order = await tx.order.create({
                data: {
                    id: generateOrderCode({ name: outlet.name, maxLength: 12 }, { randomLength: 6 }),
                    guestCustomerId: customer.id,
                    outletId,
                    totalAmount,
                    midtransFee: midtransFee,
                    appFee: appFee,
                    chargedTo: feeBearer,
                    bookingDate: bookingDate ? new Date(bookingDate) : null,
                },
            });

            // 3. Create the order items
            await tx.orderItem.createMany({
                data: items.map((item) => ({
                    orderId: order.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    // priceAtTimeOfOrder will be set in the service layer
                    priceAtTimeOfOrder: 0, // Placeholder
                })),
            });

            // 4. (Optional) Update product stock if it's a GOOD
            // This logic is better handled in the service layer after this transaction

            return order;
        });
    }

    static async findById(id: string) {
        return db.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                guestCustomer: true,
                outlet: true,
                bookingSlot: true,
                transaction: true
            },
        });
    }

    static async getOrderByCustomerPhone(phone: string) {
        return db.order.findMany({
            where: { guestCustomer: { phone } },
            include: {
                items: {
                    select: {
                        id: true,
                        priceAtTimeOfOrder: true,
                        quantity: true,
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                type: true,
                                image: true,
                                unit: true,
                                serviceDurationMinutes: true,
                                outletId: true,
                            }
                        }
                    }
                },
                bookingSlot: {
                    select: {
                        id: true,
                        date: true,
                        startTime: true,
                        endTime: true,
                        status: true,
                        productId: true,
                        staffId: true,
                        staff: {
                            select: {
                                id: true,
                                name: true,
                                phone: true,
                                role: true,
                            }
                        } as any,
                    }
                },
                guestCustomer: { select: { name: true, phone: true, id: true } },
                outlet: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        address: true,
                    }
                },
                assignedStaff: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        role: true,
                    }
                } as any,
                transaction: {
                    select: {
                        id: true,
                        paymentMethod: true,
                        status: true,
                        expiresAt: true,
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        })
    }

    static async findByProductId(productId: string, status: OrderStatus) {
        return db.order.findMany({
            where: {
                items: {
                    some: {
                        productId: productId,
                    },
                },
                orderStatus: status,
            },
            include: {
                guestCustomer: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    static async updateStatus(id: string, status: OrderStatus) {
        return db.order.update({
            where: { id },
            data: { orderStatus: status },
        });
    }
}