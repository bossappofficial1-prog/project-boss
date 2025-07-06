import { ProductType } from "@prisma/client";
import { config } from "../configs/config";
import { db } from "../configs/database";
import { FEES } from "../configs/midtrans";
import { AppError } from "../errors/api_errors";
import { getOutletById } from "./outlet.service";
import { initiateMidtransPayment } from "./pay.service";
import { getUserById } from "./user.service";
import { generateTransactionCode } from "../utils/code_generator";
import { getProductById } from "./product.service";

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
}) {
    const newOrder = await db.$transaction(async (tx) => {
        const customer = await getUserById(order.customerId);
        if (!customer) throw new AppError('Customer not found', 404); // Added check for customer

        const outlet = await tx.outlet.findUnique({
            where: { id: order.outletId },
            include: { business: true }
        });

        if (!outlet) throw new AppError('Outlet not found', 404);

        const feeBearerPrefrence: FeeBearerType = outlet.business.defaultTransactionFeeBearer;

        let totalAmount = 0;
        const validatedItems = [];

        for (const item of order.items) {
            const product = await tx.product.findUnique({
                where: { id: item.productId },
            });

            if (!product) throw new AppError(`Product with ID ${item.productId} not found`, 404); // More specific error

            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal; // ADD TO totalAmount REGARDLESS OF TYPE

            validatedItems.push({
                productId: item.productId,
                quantity: item.quantity,
                priceAtTimeOfOrder: product.price,
                product: product // Keep product for later stock/item details
            });

            // Handle stock deduction ONLY for GOODS type
            if (product.type === "GOODS") {
                // Ensure product.quantity (stok) exists for GOODS
                if (product.quantity === null || product.quantity === undefined) {
                    throw new AppError(`Stok produk ${product.name} tidak terdefinisi.`, 400);
                }
                if (product.quantity < item.quantity) {
                    throw new AppError(`Stok tidak mencukupi untuk produk ${product.name}. Stok tersedia: ${product.quantity}, Diminta: ${item.quantity}`, 400);
                }
                // Don't update stock here yet, do it after successful Midtrans payment or order creation.
                // Your commented out stock update loop is correct for later.
            }
            // For 'SERVICE' type, you might not have a 'quantity' or 'stock' check needed here.
            // If service has a limited capacity, you'd check that here instead of 'product.quantity'.
        }

        // Ensure totalAmount is not zero before proceeding to Midtrans
        if (totalAmount <= 0) {
            throw new AppError('Total order amount must be greater than zero.', 400);
        }


        const platformFee = totalAmount * FEES.QRIS;
        let finalAmountMidtrans = totalAmount; // Start with base total amount
        let bookingAdminFee = 0;

        // Calculate bookingAdminFee based on totalAmount
        bookingAdminFee = totalAmount * FEES.TRANSACTION;

        // If customer bears fees, add them to finalAmountMidtrans
        if (feeBearerPrefrence === "CUSTOMER") {
            finalAmountMidtrans += bookingAdminFee;
            finalAmountMidtrans += platformFee; // Add platform fee if customer bears it
        } else {
            // If OWNER bears fees, they are not added to finalAmountMidtrans sent to Midtrans
            // but might be deducted from the owner's payout later.
            // For Midtrans gross_amount, it's the customer's payable amount.
            // So if owner pays platformFee, don't add to finalAmountMidtrans here.
            // If owner pays bookingAdminFee, don't add to finalAmountMidtrans here.
        }

        // Round finalAmountMidtrans to two decimal places for Midtrans if necessary,
        // though integer amounts (rupiah) are typically sent without decimals.
        // If your prices can have decimals, ensure rounding:
        // finalAmountMidtrans = parseFloat(finalAmountMidtrans.toFixed(2));

        const createOrder = await tx.order.create({
            data: {
                id: generateTransactionCode({ name: outlet.name }, { upperCase: true }),
                customerId: order.customerId,
                outletId: order.outletId,
                totalAmount: totalAmount, // Store the base total amount without fees
                bookingDate: order.bookingDate,
                paymentStatus: 'PENDING',
                queueStatus: 'AWAITING_PAYMENT',
                customerType: `REGISTERED`,
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
        });

        const midtransItemDetails = validatedItems.map(item => ({
            id: item.productId,
            price: item.priceAtTimeOfOrder,
            quantity: item.quantity,
            name: item.product.name
        }));

        // Conditionally add fees as separate items if customer bears them
        if (feeBearerPrefrence === "CUSTOMER") {
            if (bookingAdminFee > 0) {
                midtransItemDetails.push({
                    id: `admin_fee_booking`, // Unique ID
                    price: bookingAdminFee,
                    quantity: 1,
                    name: 'Biaya Admin Booking'
                });
            }
            if (platformFee > 0) { // Add platform fee as a separate item if customer bears it
                midtransItemDetails.push({
                    id: 'platform_fee', // Unique ID
                    price: platformFee,
                    name: "Biaya Platform",
                    quantity: 1
                });
            }
        }
        // IMPORTANT: Ensure the sum of item prices matches finalAmountMidtrans

        const midtransCustomerDetail = {
            first_name: customer.name.split(" ")[0],
            last_name: customer.name.split(" ").slice(1).join(" ") || "",
            email: customer.email
        };

        // Ensure finalAmountMidtrans is at least 0.01 (or 1 in IDR if it's integer based)
        if (finalAmountMidtrans < 0.01) { // Or finalAmountMidtrans < 1 if only integer amounts are allowed
            throw new AppError('Final transaction amount for Midtrans must be at least 0.01.', 400);
        }

        const midtransResponse = await initiateMidtransPayment(
            createOrder.id,
            finalAmountMidtrans, // This is the gross_amount Midtrans will receive
            midtransItemDetails,
            midtransCustomerDetail,
            config.midtrans.MIDTRANS_NOTIFICATION_CALLBACK_URL
        );

        await tx.order.update({
            where: { id: createOrder.id },
            data: {
                midtransTransactionToken: midtransResponse.token,
                midtransRedirectUrl: midtransResponse.redirectUrl
            }
        });

        // Create the transaction record
        await tx.transaction.create({
            data: {
                orderId: createOrder.id,
                amount: finalAmountMidtrans, // Store the amount sent to Midtrans
                status: 'CREATED',
                fee: platformFee, // This is the platform fee
                adminFee: bookingAdminFee, // This is your booking admin fee
                feePaidBy: feeBearerPrefrence
            }
        });

        // Uncomment this section when you are ready to update stock
        // for (const item of validatedItems) {
        //     if (item.product.type === "GOODS") {
        //         await tx.product.update({ // Update product directly if stock is on Product
        //             where: { id: item.productId },
        //             data: { quantity: { decrement: item.quantity } }
        //         })
        //     }
        // }

        return { ...midtransResponse };
    });

    return newOrder;
}

export async function getAllOrderService(page: number, limit: number, search?: string) {
    const take = page * limit // banyak data yang diambil
    const skip = (page - 1) * limit

    const orders = await db.order.findMany({
        include: {
            transaction: {
                select: {
                    amount: true
                }
            }
        },
        take,
        skip
    });

    // Urutkan pesanan di JavaScript
    const sortedOrders = orders.sort((a, b) => {
        // Bandingkan jumlah transaksi dari terbesar ke terkecil
        // Jika kedua pesanan memiliki transaksi (atau keduanya tidak), urutkan berdasarkan amount
        if (a.transaction && b.transaction) {
            return b.transaction.amount - a.transaction.amount;
        }

        // Jika hanya salah satu yang punya transaksi, yang punya transaksi diletakkan di depan
        if (a.transaction && !b.transaction) {
            return -1; // 'a' (punya transaksi) datang sebelum 'b' (tidak punya)
        }
        if (!a.transaction && b.transaction) {
            return 1; // 'b' (punya transaksi) datang sebelum 'a' (tidak punya)
        }

        // Jika keduanya tidak punya transaksi, tidak ada perubahan urutan relatif
        return 0;
    });

    return sortedOrders;
}

export async function getOrderOutlet(outletId: string, type: ProductType) {
    const outlet = await getOutletById(outletId)

    const orders = await db.order.findMany({
        where: {
            AND: [
                { outletId },
                { items: { some: { product: { type } } } }
            ],
        },

        select: {
            id: true,
            totalAmount: true,
            bookingDate: true,
            paymentStatus: true,
            transaction: {
                select: {
                    id: true,
                    adminFee: true,
                    feePaidBy: true,
                    paidAt: true,
                    amount: true
                }
            },
            customer: {
                select: {
                    name: true,
                    avatar: true
                }
            }
        }
    })

    if (!orders) throw new AppError(`Tidak ditemukan order pada outlet ${outlet.name}`)

    return orders
}

export async function createOrderProductService(outletId: string,
    items: { productId: string, quantity: number }[],
    customerInfo: {
        name: string,
        email: string,
        phone: string
    },
    bookingDate?: string,
    bookingSlotId?: string
) {
    const outlet = await getOutletById(outletId)

    if (!outlet) throw new AppError("Outlet tidak ditemukan", 404);

    let totalAmount = 0
    const validatedItems = []

    for (const item of items) {
        const product = await getProductById(item.productId)

        if (!product) throw new AppError(`Product ${item.productId} tidak ditemukan`, 404);

    }
}