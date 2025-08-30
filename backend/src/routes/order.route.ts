import { Request, Response, Router } from "express";
import { createOrderController, getOrderByIdController, getOrderReceiptController, refundOrderController, updateOrderStatusController, completeOrderController, listGoodsOrdersByOutletController, listServiceQueueByOutletController } from "../controller/order.controller";
import { validateSchema } from "../middleware/zod.middleware";
import { createOrderSchema, updateOrderStatusSchema } from "../schemas/order.schema";
import { authorize, protect } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";
import { orderCreationLimiter, orderManagementLimiter } from "../middleware/order-rate-limit.middleware";
import { validateGuestCustomer, validateBusinessHours, validateOrderFrequency } from "../middleware/guest-validation.middleware";
import { coreApi } from "../config/midtrans";
import { generateOrderCode, ResponseUtil } from "../utils";
import Console from "../utils/logger";
import { PaymentMethodId, paymentMethodMapping, MidtransPaymentMethod } from "../constants/payment-method";
import { OutletRepository } from "../repositories/outlet.repository";
import { ProductRepository } from "../repositories/product.repository";

const orderRouter = Router();

// SECURITY FIX: Add comprehensive validation for public guest order creation
orderRouter.post("/",
    orderCreationLimiter,
    validateGuestCustomer,
    validateBusinessHours,
    validateOrderFrequency,
    validateSchema(createOrderSchema),
    createOrderController
);

// SECURITY FIX: Add rate limiting for owner order management
orderRouter.use(orderManagementLimiter);

// Rute yang dilindungi untuk melihat detail pesanan
orderRouter.get("/:id", getOrderByIdController);

// Rute yang dilindungi untuk memproses refund
orderRouter.post("/:id/refund", protect, authorize(UserRole.OWNER), refundOrderController);

// Rute yang dilindungi untuk mencetak struk
orderRouter.get("/:id/receipt", protect, authorize(UserRole.OWNER), getOrderReceiptController);

// Rute yang dilindungi untuk memperbarui status pesanan
orderRouter.patch("/:id/status", protect, authorize(UserRole.OWNER), validateSchema(updateOrderStatusSchema), updateOrderStatusController);

// Rute yang dilindungi untuk menyelesaikan pesanan
orderRouter.post("/:id/complete", protect, authorize(UserRole.OWNER), completeOrderController);

// List pesanan barang berdasarkan outlet (owner only)
orderRouter.get("/:outletId/goods", protect, authorize(UserRole.OWNER), listGoodsOrdersByOutletController);

// List antrian layanan berdasarkan outlet (owner only)
orderRouter.get("/:outletId/queue", protect, authorize(UserRole.OWNER), listServiceQueueByOutletController);

orderRouter.post("/create-payment", async (req: Request, res: Response) => {
    try {
        // console.log(req.body);

        const { customer_details, item_details, payment_method: paymentType } = req.body as {
            customer_details: {
                name: string,
                phone: string
            },
            item_details: {
                productId: string,
                quantity: number,
                outletId: string
            }[],
            payment_method: PaymentMethodId
        }
        const uniqueOutletIds = new Set(item_details.map(order => order.outletId))
        // const outlet = await OutletRepository.findById(order_details)
        // console.log(uniqueOutletIds);

        // Validasi payment type
        if (!paymentMethodMapping[paymentType]) {
            throw new Error(`Payment type ${paymentType} not supported`);
        }

        // Mapping payment method ke Midtrans format
        const midtransPaymentType: MidtransPaymentMethod = paymentMethodMapping[paymentType];
        let order_details = []
        let gross_amount: number = 0
        let transaction_amount = 0
        let application_amount = 0

        for (const item of item_details) {
            const product = await ProductRepository.findById(item.productId)
            const price = product?.price! * item.quantity
            order_details.push({
                id: product?.id,
                quantity: item.quantity,
                name: product?.name,
                price
            })
            gross_amount += price
        }


        for (const outletId of uniqueOutletIds) {
            const outlet = await OutletRepository.findById(outletId)
            if (outlet?.business.defaultTransactionFeeBearer === "CUSTOMER") {
                // console.log(gross_amount * 0.02);
                const price = Math.floor(gross_amount * 0.02)
                transaction_amount = price

                order_details.push({
                    id: "transaction-fees",
                    quantity: 1,
                    price,
                    name: "Biaya Traksaksi"
                })
            }
        }

        application_amount = gross_amount * 0.03
        gross_amount += transaction_amount + application_amount

        const orderId = generateOrderCode({ name: "Test" })

        let payload: any = {
            transaction_details: {
                order_id: orderId,
                gross_amount
            },
            customer_details: {
                full_name: customer_details.name,
                phone: customer_details.phone
            },
            order_details
        }

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
                throw new Error(`Midtrans payment type ${midtransPaymentType} not implemented`);
        }

        const response = await coreApi.charge(payload)
        console.log(JSON.stringify(response));

        ResponseUtil.success(res, response)
    } catch (error) {
        ResponseUtil.error(res, "Terjadi masalah")
    }
})

export default orderRouter;