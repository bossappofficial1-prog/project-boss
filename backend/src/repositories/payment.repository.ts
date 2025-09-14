import { Product, Outlet } from "@prisma/client";
import { db } from "../config/prisma";
import { CreatePaymentInput } from "../schemas/payment.schema";

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
}
