import { snap, coreApi } from '../config/midtrans';
import { getOrderByIdService } from './order.service';
import { db } from '../config/prisma';
import { config } from '../config';
import { PaymentStatus, Order, OrderItem, Product, GuestCustomer, FeeBearer } from '@prisma/client';
import { messagePublisher } from './message-publisher.service';
import { CreatePaymentPayload } from '../schemas/payment-v2.schema';
import { MidtransPaymentMethod, PaymentMethodId, paymentMethodMapping } from '../constants/payment-method';
import { OutletRepository } from '../repositories/outlet.repository';
import { ProductRepository } from '../repositories/product.repository';
import { generateOrderCode } from '../utils';
import Console from '../utils/logger';
import { MidtransItem, MidtransPayload, MidtransWebhookPayloadType } from '../types/Others';
import { mappingTransactionStatusForMidtrans } from '../utils/mapping';
import { AppError } from '../errors/app-error';
import { Messages } from '../constants/message';
import { HttpStatus } from '../constants/http-status';

// Konstanta untuk fee rates
const TRANSACTION_FEE_RATE = 0.02;
const APPLICATION_FEE_RATE = 0.03;

type OrderWithDetails = Order & {
    items: (OrderItem & { product: Product })[];
    guestCustomer: GuestCustomer;
};

// Sub-fungsi untuk validasi dan prepare data
async function validateItemsAndPrepareData(inputItems: any[], outletId: string) {
    const productIds = inputItems.map((item) => item.productId);
    const [products, outlet] = await Promise.all([
        ProductRepository.findManyByIds(productIds),
        OutletRepository.findById(outletId),
    ]);

    if (!outlet) {
        throw new AppError(Messages.OUTLET_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const productMap = new Map(products.map((p: Product) => [p.id, p]));
    const itemDetails: MidtransItem[] = [];
    let totalProductPrice = 0;

    for (const item of inputItems) {
        const product = productMap.get(item.productId);
        if (!product) {
            throw new AppError(Messages.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        const subtotal = product.price * item.quantity;
        totalProductPrice += subtotal;

        itemDetails.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
        });
    }

    return { productMap, outlet, itemDetails, totalProductPrice };
}

// Sub-fungsi untuk hitung biaya
function calculateFees(totalProductPrice: number, outlet: any) {
    const transactionFeeTotal =
        outlet.business.defaultTransactionFeeBearer === "CUSTOMER" ?
            Math.floor(totalProductPrice * TRANSACTION_FEE_RATE) :
            0;

    const applicationFee = Math.floor(totalProductPrice * APPLICATION_FEE_RATE);
    const grossAmount = totalProductPrice + transactionFeeTotal + applicationFee;

    return { transactionFeeTotal, applicationFee, grossAmount };
}

// Sub-fungsi untuk build payload Midtrans
function buildMidtransPayload(orderId: string, grossAmount: number, itemDetails: MidtransItem[], customerDetails: any, midtransPaymentType: string) {
    const payload: MidtransPayload = {
        transaction_details: {
            order_id: orderId,
            gross_amount: grossAmount,
        },
        customer_details: {
            first_name: customerDetails.name,
            phone: customerDetails.phone,
        },
        item_details: itemDetails,
        payment_type: "",
    };

    if (midtransPaymentType.endsWith("_va")) {
        payload.payment_type = "bank_transfer";
        payload.bank_transfer = {
            bank: midtransPaymentType.replace("_va", ""),
        };
    } else {
        payload.payment_type = "qris";
    }

    return payload;
}

// Sub-fungsi untuk create order dan items
async function createOrderAndItems(orderId: string, grossAmount: number, applicationFee: number, transactionFeeTotal: number, selectedSlotId: string | undefined, outletId: string, customerDetails: any, inputItems: any[], productMap: Map<string, Product>) {
    await db.$transaction(async (tr) => {
        await tr.order.create({
            data: {
                id: orderId,
                totalAmount: grossAmount,
                appFee: applicationFee,
                midtransFee: transactionFeeTotal,
                chargedTo: FeeBearer.CUSTOMER,
                ...(selectedSlotId && {
                    bookingSlot: {
                        connect: {
                            id: selectedSlotId
                        }
                    },
                }),
                guestCustomer: {
                    create: {
                        name: customerDetails.name,
                        phone: customerDetails.phone,
                    },
                },
                outlet: {
                    connect: {
                        id: outletId
                    },
                },
            },
        });

        for (const item of inputItems) {
            const product = productMap.get(item.productId);

            if (product?.type === "GOODS") {
                const productQuantity = product.quantity ?? 0;
                if (item.quantity > productQuantity) {
                    throw new AppError(Messages.PRODUCT_OUT_OF_STOCK, HttpStatus.BAD_REQUEST);
                }
            } else if (product?.type === "SERVICE" && selectedSlotId) {
                const bookingSlot = await tr.bookingSlot.findUnique({
                    where: { id: selectedSlotId },
                });

                if (!bookingSlot) throw new AppError(Messages.BOOKING_SLOT_NOT_FOUND, HttpStatus.NOT_FOUND);
                if (bookingSlot.status === "BOOKED" || bookingSlot.status === "BLOCKED") throw new AppError(Messages.BOOKING_SLOT_ALREADY_BOOKED, HttpStatus.BAD_REQUEST);

            } else if (product?.type === "SERVICE" && !selectedSlotId) throw new AppError(Messages.BOOKING_SLOT_REQUIRED, HttpStatus.BAD_REQUEST);

            await tr.orderItem.create({
                data: {
                    orderId,
                    productId: product?.id!,
                    quantity: item.quantity,
                    priceAtTimeOfOrder: product?.price!,
                },
            });

            if (product?.type === "GOODS") {
                await tr.product.update({
                    where: { id: product.id },
                    data: {
                        quantity: {
                            decrement: item.quantity
                        },
                    },
                });
            }

            if (product?.type === "SERVICE") {
                await tr.bookingSlot.update({ where: { id: selectedSlotId }, data: { status: "BOOKED" } });
            }
        }
    });
}

// Sub-fungsi untuk handle Midtrans charge
async function handleMidtransCharge(payload: MidtransPayload, orderId: string) {
    try {
        const midtransResponse = await coreApi.charge(payload) as MidtransWebhookPayloadType;

        await db.transaction.create({
            data: {
                id: midtransResponse.transaction_id,
                externalId: midtransResponse.transaction_id,
                amount: Number(midtransResponse.gross_amount),
                paymentMethod: midtransResponse.payment_type,
                expiresAt: new Date(midtransResponse.expiry_time),
                orderId: orderId,
                status: mappingTransactionStatusForMidtrans(midtransResponse.transaction_status),
            },
        });

        return midtransResponse;
    } catch (error) {
        await db.order.delete({
            where: {
                id: orderId
            }
        });
        throw error;
    }
}

export async function createMidtransTransactionService(orderId: string, finalAmount: number, midtransFee: number, appFee: number, paymentMethod: 'online' | 'qris', chargedTo: 'customer' | 'owner') {
    const order = await getOrderByIdService(orderId) as OrderWithDetails;
    if (!order) {
        throw new Error('Order not found');
    }

    const itemDetails = order.items.map(item => ({
        id: item.productId,
        name: item.product.name,
        price: Math.round(item.priceAtTimeOfOrder),
        quantity: item.quantity,
    }));

    // Selalu tambahkan biaya Midtrans sebagai item terpisah
    if (midtransFee > 0) {
        itemDetails.push({
            id: 'midtrans_fee',
            name: 'Biaya Admin Midtrans (1%)',
            price: midtransFee,
            quantity: 1,
        });
    }

    // Tambahkan biaya aplikasi sebagai item terpisah jika ada
    if (appFee > 0) {
        itemDetails.push({
            id: 'app_fee',
            name: 'Biaya Admin Aplikasi (3%)',
            price: appFee,
            quantity: 1,
        });
    }

    // Hitung gross_amount final dari item_details yang sudah lengkap
    // untuk memastikan tidak ada selisih.
    const calculatedGrossAmount = itemDetails.reduce((acc, item) => {
        return acc + (item.price * item.quantity);
    }, 0);

    const parameter = {
        transaction_details: {
            order_id: order.id,
            gross_amount: calculatedGrossAmount,
        },
        customer_details: {
            first_name: order.guestCustomer.name,
            phone: order.guestCustomer.phone,
            email: 'noreply@bossin.id', // Default email untuk Midtrans
        },
        item_details: itemDetails,
        expiry: {
            unit: "minute",
            duration: 15
        }
    };

    const transaction = await snap.createTransaction(parameter);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.transaction.create({
        data: {
            orderId: order.id,
            amount: calculatedGrossAmount, // Gunakan juga di sini untuk konsistensi
            status: PaymentStatus.PENDING,
            externalId: transaction.token, // Snap token
            paymentUrl: transaction.redirect_url, // URL pembayaran
            expiresAt: expiresAt,
        },
    });

    return transaction;
}

export async function createQrisPaymentService(orderId: string) {
    const order = await getOrderByIdService(orderId);
    if (!order) {
        throw new Error('Order not found');
    }

    const parameter = {
        payment_type: "qris",
        transaction_details: {
            order_id: order.id,
            gross_amount: order.totalAmount,
        },
        custom_expiry: {
            order_time: new Date().toISOString().slice(0, 19) + " +0700",
            expiry_duration: 15,
            unit: "minute"
        }
    };

    const chargeResponse = await coreApi.charge(parameter);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Save transaction details to our database
    await db.transaction.create({
        data: {
            orderId: order.id,
            amount: order.totalAmount,
            status: PaymentStatus.PENDING,
            externalId: chargeResponse.transaction_id,
            // Untuk QRIS, tidak ada URL redirect langsung, tapi kita bisa simpan link ke gambar QR
            paymentUrl: chargeResponse.actions?.find((a: any) => a.name === 'deeplink-redirect')?.url || chargeResponse.actions?.find((a: any) => a.name === 'generate-qr-code')?.url,
            expiresAt: expiresAt,
        },
    });

    return chargeResponse;
}

export async function createPaymentService(data: CreatePaymentPayload) {
    const {
        customer_details: customerDetails,
        item_details: inputItems,
        payment_method,
        selectedSlotId,
        outletId,
    } = data;

    // Validasi dan prepare data
    const { productMap, outlet, itemDetails: baseItemDetails, totalProductPrice } = await validateItemsAndPrepareData(inputItems, outletId);

    // Hitung biaya
    const { transactionFeeTotal, applicationFee, grossAmount } = calculateFees(totalProductPrice, outlet);

    // Tambahkan item biaya ke detail
    const itemDetails = [...baseItemDetails];
    if (transactionFeeTotal > 0) {
        itemDetails.push({
            id: `transaction-fee-${outletId}`,
            name: "Biaya Transaksi",
            price: transactionFeeTotal,
            quantity: 1,
        });
    }
    itemDetails.push({
        id: "app_fee",
        name: "Biaya Aplikasi",
        price: applicationFee,
        quantity: 1,
    });

    const orderId = generateOrderCode({ name: "Test" });
    const paymentMethod = payment_method as PaymentMethodId;
    const midtransPaymentType = paymentMethodMapping[paymentMethod];

    // Build payload Midtrans
    const payload = buildMidtransPayload(orderId, grossAmount, itemDetails, customerDetails, midtransPaymentType);

    // Create order dan items
    await createOrderAndItems(orderId, grossAmount, applicationFee, transactionFeeTotal, selectedSlotId, outletId, customerDetails, inputItems, productMap);

    // Handle Midtrans charge
    return await handleMidtransCharge(payload, orderId);
}

export async function cancelPaymentService(orderId: string) {
    // Cari transaksi berdasarkan orderId
    const transaction = await db.transaction.findFirst({
        where: { orderId },
        include: { order: { include: { items: { include: { product: true } } } } },
    });

    if (!transaction) {
        throw new AppError(Messages.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (transaction.status !== PaymentStatus.PENDING) {
        throw new AppError("Pembayaran tidak dapat dibatalkan karena status sudah " + transaction.status, HttpStatus.BAD_REQUEST);
    }

    // Cancel via Midtrans API (manual HTTP request)
    try {
        await coreApi.transaction.cancel(orderId);
    } catch (error) {
        Console.error("Error expiring Midtrans transaction:", error);
        throw new AppError("Gagal membatalkan pembayaran di Midtrans", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Update status transaksi di database
    await db.transaction.update({
        where: { id: transaction.id },
        data: { status: PaymentStatus.CANCELLED },
    });

    // Rollback stok untuk produk GOODS
    await db.$transaction(async (tr) => {
        for (const item of transaction.order.items) {
            if (item.product.type === "GOODS") {
                await tr.product.update({
                    where: { id: item.product.id },
                    data: {
                        quantity: {
                            increment: item.quantity
                        },
                    },
                });
            }
        }
    });

    return { message: "Pembayaran berhasil dibatalkan", orderId };
}
