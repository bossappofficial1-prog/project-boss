import { snap, coreApi } from '../config/midtrans';
import { getOrderByIdService } from './order.service';
import { db } from '../config/prisma';
import { PaymentStatus, Order, OrderItem, Product, GuestCustomer, FeeBearer } from '@prisma/client';
import { messagePublisher } from './message-publisher.service';
import { CreatePaymentPayload } from '../schemas/payment-v2.schema';
import { MidtransPaymentMethod, PaymentMethodId, paymentMethodMapping } from '../constants/payment-method';
import { OutletRepository } from '../repositories/outlet.repository';
import { ProductRepository } from '../repositories/product.repository';
import { generateOrderCode } from '../utils';
import Console from '../utils/logger';

type OrderWithDetails = Order & {
    items: (OrderItem & { product: Product })[];
    guestCustomer: GuestCustomer;
};

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

// export async function createPaymentService(data: CreatePaymentPayload) {
//     const { customer_details: customerDetails, item_details: itemDetails, payment_method, bookingSlotId } = data
//     const paymentMethod = payment_method as PaymentMethodId

//     const uniqueOutletIds = new Set(itemDetails.map(order => order.outletId))

//     // Mapping payment method ke Midtrans format
//     const midtransPaymentType: MidtransPaymentMethod = paymentMethodMapping[paymentMethod];

//     let item_details = []
//     const customer_details = {
//         first_name: customerDetails.name,
//         phone: customerDetails.phone
//     }

//     let gross_amount: number = 0
//     let transaction_amount = 0
//     let application_amount = 0

//     for (const item of itemDetails) {
//         const product = await ProductRepository.findById(item.productId)
//         const price = product?.price! * item.quantity
//         item_details.push({
//             id: product?.id,
//             quantity: item.quantity,
//             name: product?.name,
//             price: product?.price
//         })
//         gross_amount += price
//     }


//     for (const outletId of uniqueOutletIds) {
//         const outlet = await OutletRepository.findById(outletId)
//         if (outlet?.business.defaultTransactionFeeBearer === "CUSTOMER") {
//             const price = Math.floor(gross_amount * 0.02)
//             transaction_amount = price

//             item_details.push({
//                 id: "transaction-fees",
//                 quantity: 1,
//                 price,
//                 name: "Biaya Traksaksi"
//             })
//         }
//     }

//     application_amount = gross_amount * 0.03
//     gross_amount += transaction_amount + application_amount

//     item_details.push({
//         id: "app_fee",
//         quantity: 1,
//         price: application_amount,
//         name: "Biaya Aplikasi"
//     })

//     const orderId = generateOrderCode({ name: "Test" })

//     let payload: any = {
//         transaction_details: {
//             order_id: orderId,
//             gross_amount
//         },
//         customer_details,
//         item_details
//     }

//     Console.log("Gross Amount: ", gross_amount,
//         "\nPayload Gross Amount: ", payload.transaction_details.gross_amount,
//         "\nItem Details: ", payload.item_details);


//     // Set payment type berdasarkan mapping
//     switch (midtransPaymentType) {
//         case "qris":
//             payload.payment_type = "qris";
//             break;

//         case "bca_va":
//             payload.payment_type = "bank_transfer";
//             payload.bank_transfer = { bank: "bca" };
//             break;

//         case "bni_va":
//             payload.payment_type = "bank_transfer";
//             payload.bank_transfer = { bank: "bni" };
//             break;

//         case "bri_va":
//             payload.payment_type = "bank_transfer";
//             payload.bank_transfer = { bank: "bri" };
//             break;

//         case "mandiri_va":
//             payload.payment_type = "bank_transfer";
//             payload.bank_transfer = { bank: "mandiri" };
//             break;

//         case "permata_va":
//             payload.payment_type = "bank_transfer";
//             payload.bank_transfer = { bank: "permata" };
//             break;

//         default:
//             throw new Error(`Midtrans payment type ${midtransPaymentType} not implemented`);
//     }

//     const result = await db.$transaction(async (tr) => {
//         for(const outletId of uniqueOutletIds){
//             const order = await tr.order.create({
//                 data: {
//                     id: orderId,
//                     totalAmount: gross_amount,
//                     appFee: application_amount,
//                     ...(bookingSlotId && {
//                         bookingSlot: { connect: { id: bookingSlotId } }
//                     }),
//                     midtransFee: transaction_amount,
//                     chargedTo: FeeBearer.CUSTOMER,
//                     guestCustomer: {
//                         create: {
//                             name: customerDetails.name,
//                             phone: customerDetails.phone
//                         }
//                     },
//                     outlet: {
//                         connect: { id: outletId }
//                     }
//                 }
//             })
//         }
//     })

//     return await coreApi.charge(payload)
// }


export async function createPaymentService(data: CreatePaymentPayload) {
    const {
        customer_details: customerDetails,
        item_details: inputItems,
        payment_method,
        selectedSlotId
    } = data;

    const paymentMethod = payment_method as PaymentMethodId;
    const midtransPaymentType: MidtransPaymentMethod =
        paymentMethodMapping[paymentMethod];

    // Build item details for Midtrans
    const itemDetails: any[] = [];
    let grossAmount = 0;
    let transactionFeeTotal = 0;
    let applicationFee = 0;

    for (const item of inputItems) {
        const product = await ProductRepository.findById(item.productId);
        if (!product) {
            throw new Error(`Product with id ${item.productId} not found`);
        }

        const subtotal = product.price * item.quantity;

        itemDetails.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
        });

        grossAmount += subtotal;
    }

    // Tambah transaction fee (per outlet)
    const outlet = await OutletRepository.findById(data.outletId);
    if (outlet?.business.defaultTransactionFeeBearer === "CUSTOMER") {
        const fee = Math.floor(grossAmount * 0.02);
        transactionFeeTotal += fee;

        itemDetails.push({
            id: `transaction-fee-${data.outletId}`,
            name: "Biaya Transaksi",
            price: fee,
            quantity: 1,
        });
    }

    // Application fee (selalu ditanggung customer di sini)
    applicationFee = Math.floor(grossAmount * 0.03);
    grossAmount += transactionFeeTotal + applicationFee;

    itemDetails.push({
        id: "app_fee",
        name: "Biaya Aplikasi",
        price: applicationFee,
        quantity: 1,
    });

    const orderId = generateOrderCode({ name: "Test" });

    // Payload Midtrans
    const payload: any = {
        transaction_details: {
            order_id: orderId,
            gross_amount: grossAmount,
        },
        customer_details: {
            first_name: customerDetails.name,
            phone: customerDetails.phone,
        },
        item_details: itemDetails,
    };

    // Set payment type berdasarkan mapping
    switch (midtransPaymentType) {
        case "qris":
            payload.payment_type = "qris";
            break;
        case "bca_va":
            payload.payment_type = "bank_transfer";
            payload.bank_transfer = { bank: "bca" };
            break;
        case "bni_va":
            payload.payment_type = "bank_transfer";
            payload.bank_transfer = { bank: "bni" };
            break;
        case "bri_va":
            payload.payment_type = "bank_transfer";
            payload.bank_transfer = { bank: "bri" };
            break;
        case "mandiri_va":
            payload.payment_type = "bank_transfer";
            payload.bank_transfer = { bank: "mandiri" };
            break;
        case "permata_va":
            payload.payment_type = "bank_transfer";
            payload.bank_transfer = { bank: "permata" };
            break;
        default:
            throw new Error(
                `Midtrans payment type ${midtransPaymentType} not implemented`
            );
    }

    // Simpan order dan orderItem
    await db.$transaction(async (tr) => {
        const order = await tr.order.create({
            data: {
                id: orderId,
                totalAmount: grossAmount,
                appFee: applicationFee,
                midtransFee: transactionFeeTotal,
                chargedTo: FeeBearer.CUSTOMER,
                ...(selectedSlotId && {
                    bookingSlot: { connect: { id: selectedSlotId } },
                }),
                guestCustomer: {
                    create: {
                        name: customerDetails.name,
                        phone: customerDetails.phone,
                    },
                },
                outlet: {
                    connect: { id: data.outletId },
                },
            },
        });

        // Create order items
        for (const item of inputItems) {
            await tr.orderItem.create({
                data: {
                    orderId: order.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    priceAtTimeOfOrder: (
                        await ProductRepository.findById(item.productId)
                    )?.price!,
                },
            });
        }
    });

    return coreApi.charge(payload);
}
