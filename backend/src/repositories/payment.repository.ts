import { Product, Outlet, PaymentStatus } from "@prisma/client";
import { db } from "../config/prisma";
import { CreatePaymentInput } from "../schemas/payment.schema";
import { AppError } from "../errors/app-error";

export class PaymentRepository {
    /**
     * Get products by IDs with outlet validation
     */
    static async getProductsByIds(productIds: string[]): Promise<Product[]> {
        return db.product.findMany({
            where: {
                id: { in: productIds },
                status: 'ACTIVE',
                OR: [
                    { quantity: { gt: 0 } },
                    { type: 'SERVICE' }
                ]
            }
        });
    }

    /**
     * Get outlet by ID
     */
    static async getOutletById(outletId: string): Promise<Outlet | null> {
        return db.outlet.findUnique({
            where: { id: outletId }
        });
    }

    /**
     * Validate product availability and stock
     */
    static async validateProductAvailability(
        productId: string,
        quantity: number
    ): Promise<{ available: boolean; product: Product | null; message: string }> {
        const product = await db.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return { available: false, product: null, message: "Produk tidak ditemukan" };
        }

        if (product.status !== 'ACTIVE') {
            return { available: false, product, message: "Produk tidak aktif" };
        }

        // Check stock for GOODS type
        if (product.type === 'GOODS') {
            if (!product.quantity || product.quantity < quantity) {
                return {
                    available: false,
                    product,
                    message: `Stok tidak mencukupi. Stok tersedia: ${product.quantity || 0}`
                };
            }
        }

        return { available: true, product, message: "Produk tersedia" };
    }

    /**
     * Calculate total amount for payment
     */
    static calculateTotalAmount(products: Product[], items: CreatePaymentInput['item_details']): number {
        let total = 0;

        for (const item of items) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                total += product.price * item.quantity;
            }
        }

        return total;
    }

    /**
     * Create or find guest customer
     */
    static async createOrFindGuestCustomer(name: string, phone: string) {
        let customer = await db.guestCustomer.findFirst({
            where: { phone }
        });

        if (!customer) {
            customer = await db.guestCustomer.create({
                data: { name, phone }
            });
        }

        return customer;
    }

    static async updatePaymentStatusByOrder(orderId: string, status: PaymentStatus) {
        // Load order with items and bookingSlot to decide conditional updates
        const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true, bookingSlot: true } });

        if (order?.items) {
            for (const item of order.items) {
                await db.product.update({
                    where: { id: item.productId },
                    data: {
                        quantity: {
                            increment: item.quantity
                        }
                    }
                })
            }
        }

        // Build conditional nested update for bookingSlot only when present
        const orderUpdateData: any = {
            paymentStatus: status,
            orderStatus: 'CANCELLED'
        };

        if (order?.bookingSlot && order.bookingSlot.id) {
            orderUpdateData.bookingSlot = { update: { status: 'AVAILABLE' } };
        }

        // Update transaction(s) status first
        await db.transaction.updateMany({ where: { orderId }, data: { status } });

        // If there's a booking slot, free it
        if (order?.bookingSlot && order.bookingSlot.id) {
            await db.bookingSlot.update({ where: { id: order.bookingSlot.id }, data: { status: 'AVAILABLE' } });
        }

        // Update order status/payment status
        await db.order.update({ where: { id: orderId }, data: orderUpdateData });

        return true;
    }

    static async getByOrderId(orderId: string) {
        return await db.transaction.findUnique({
            where: { orderId },
            include: {
                order: {
                    include: {
                        guestCustomer: true,
                        items: {
                            include: {
                                product: true
                            }
                        },
                        outlet: {
                            include: {
                                business: true
                            }
                        },
                    }
                }
            }
        })
    }

    /**
     * Create order and items inside a single transaction.
     * - Decrement stock for GOODS
     * - Mark booking slot as BOOKED for SERVICE
     */
    static async createOrderWithItems(params: {
        orderId: string;
        grossAmount: number;
        appFee: number;
        midtransFee: number;
        selectedSlotId?: string | null;
        outletId: string;
        customer: { name: string; phone: string };
        items: Array<{ productId: string; quantity: number }>;
    }) {
        const { orderId, grossAmount, appFee, midtransFee, selectedSlotId, outletId, customer, items } = params;

        return await db.$transaction(async (tr) => {
            await tr.order.create({
                data: {
                    id: orderId,
                    totalAmount: grossAmount,
                    appFee: appFee,
                    midtransFee: midtransFee,
                    chargedTo: 'CUSTOMER',
                    ...(selectedSlotId && {
                        bookingSlot: {
                            connect: { id: selectedSlotId }
                        }
                    }),
                    guestCustomer: {
                        create: { name: customer.name, phone: customer.phone }
                    },
                    outlet: { connect: { id: outletId } }
                }
            });

            for (const item of items) {
                // create order item
                await tr.orderItem.create({
                    data: {
                        orderId,
                        productId: item.productId,
                        quantity: item.quantity,
                        priceAtTimeOfOrder: (await tr.product.findUnique({ where: { id: item.productId } }))?.price ?? 0
                    }
                });

                const product = await tr.product.findUnique({ where: { id: item.productId } });
                if (!product) throw new AppError('Product not found');

                if (product.type === 'GOODS') {
                    if (!product.quantity || product.quantity < item.quantity) {
                        throw new AppError(`Stok tidak mencukupi untuk produk ${product.id}`);
                    }
                    await tr.product.update({
                        where: { id: item.productId },
                        data: { quantity: { decrement: item.quantity } }
                    });
                }

                if (product.type === 'SERVICE') {
                    if (!selectedSlotId) throw new AppError('Booking slot required for service');
                    await tr.bookingSlot.update({ where: { id: selectedSlotId }, data: { status: 'BOOKED' } });
                }
            }

            return true;
        });
    }

    /**
     * Restock goods and free booking slots, mark transaction/order cancelled
     */
    static async restockAndCancelOrder(orderId: string) {
        return await db.$transaction(async (tr) => {
            const ord = await tr.order.findUnique({ where: { id: orderId }, include: { items: true, bookingSlot: true } });
            if (!ord) throw new AppError('Order not found');

            // Restock goods
            for (const item of ord.items) {
                const prod = await tr.product.findUnique({ where: { id: item.productId } });
                if (prod && prod.type === 'GOODS') {
                    await tr.product.update({ where: { id: prod.id }, data: { quantity: { increment: item.quantity } } });
                }
            }

            // Free booking slot if present
            if (ord.bookingSlot?.id) {
                await tr.bookingSlot.update({ where: { id: ord.bookingSlot.id }, data: { status: 'AVAILABLE' } });
            }

            // Update transaction and order statuses
            await tr.transaction.updateMany({ where: { orderId }, data: { status: 'CANCELLED' } });

            await tr.order.update({ where: { id: orderId }, data: { orderStatus: 'CANCELLED', paymentStatus: 'CANCELLED' } });

            return true;
        });
    }
}
