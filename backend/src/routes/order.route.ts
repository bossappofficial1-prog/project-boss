import { Router } from "express";
import { createOrderController, getOrderByIdController, getOrderReceiptController, refundOrderController, updateOrderStatusController, updateServiceOrderStatusController, completeOrderController, listGoodsOrdersByOutletController, listServiceQueueByOutletController, getOrderByCustomerPhoneController, getOrderNotificationDataController, cancelOrderByCustomerController, confirmOrderByCustomerController, getOrdersListController } from "../controller/order.controller";
import { validateSchema } from "../middleware/zod.middleware";
import { createOrderSchema, updateOrderStatusSchema, updateServiceQueueStatusSchema, customerCancelOrderSchema, customerConfirmOrderSchema } from "../schemas/order.schema";
import { authorize, protect, authorizeOwnerOrCashier } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";
import { orderCreationLimiter } from "../middleware/order-rate-limit.middleware";
import { validateGuestCustomer, validateBusinessHours, validateOrderFrequency } from "../middleware/guest-validation.middleware";
import { PaymentService } from "../service/payment.service";
import { PaymentController } from "../controller/payment.controller";
import { CreatePaymentSchema } from "../schemas/payment-v2.schema";
import { orderExpiryJob } from "../jobs/payment-expiry.job";

const orderRouter = Router();

const paymentService = new PaymentService();
const paymentController = new PaymentController(paymentService);

// SECURITY FIX: Add comprehensive validation for public guest order creation
orderRouter.post("/",
    orderCreationLimiter,
    validateGuestCustomer,
    validateBusinessHours,
    validateOrderFrequency,
    validateSchema(createOrderSchema),
    createOrderController
);

orderRouter.get("/details/:phone", getOrderByCustomerPhoneController)
orderRouter.get("/test/:orderId", async (req, res) => {
    const orderId = req.params.orderId

    await orderExpiryJob.add(orderId)

    return res.json({ message: 'success' })
})
orderRouter.post("/:id/customer/cancel", validateSchema(customerCancelOrderSchema), cancelOrderByCustomerController);
orderRouter.post("/:id/customer/confirm", validateSchema(customerConfirmOrderSchema), confirmOrderByCustomerController);
orderRouter.post("/customer/:id/cancel", validateSchema(customerCancelOrderSchema), cancelOrderByCustomerController);
orderRouter.post("/customer/:id/confirm", validateSchema(customerConfirmOrderSchema), confirmOrderByCustomerController);

// SECURITY FIX: Add rate limiting for owner order management
// orderRouter.use(orderManagementLimiter);

// Rute yang dilindungi untuk melihat semua pesanan
orderRouter.get("/", protect, authorizeOwnerOrCashier, getOrdersListController);

// Rute yang dilindungi untuk melihat detail pesanan
orderRouter.get("/:id", getOrderByIdController);

// Rute yang dilindungi untuk memproses refund
orderRouter.post("/:id/refund", protect, authorize(UserRole.OWNER), refundOrderController);

// Rute yang dilindungi untuk mencetak struk (Owner atau Kasir)
orderRouter.get("/:id/receipt", protect, authorizeOwnerOrCashier, getOrderReceiptController);

// Rute yang dilindungi untuk memperbarui status pesanan (Owner atau Kasir)
orderRouter.patch("/:id/status", protect, authorizeOwnerOrCashier, validateSchema(updateOrderStatusSchema), updateOrderStatusController);
orderRouter.patch("/:id/service-status", protect, authorizeOwnerOrCashier, validateSchema(updateServiceQueueStatusSchema), updateServiceOrderStatusController);

// Rute yang dilindungi untuk menyelesaikan pesanan (Owner atau Kasir)
orderRouter.post("/:id/complete", protect, authorizeOwnerOrCashier, completeOrderController);

// List pesanan barang berdasarkan outlet (Owner atau Kasir)
orderRouter.get("/:outletId/goods", protect, authorizeOwnerOrCashier, listGoodsOrdersByOutletController);

// List antrian layanan berdasarkan outlet (Owner atau Kasir)
orderRouter.get("/:outletId/queue", protect, authorizeOwnerOrCashier, listServiceQueueByOutletController);

// Endpoint internal untuk consumer mendapatkan data order untuk notifikasi
orderRouter.get("/:id/notification-data", getOrderNotificationDataController);

orderRouter.post("/create-payment", validateBusinessHours, validateSchema(CreatePaymentSchema), paymentController.createPayment)
orderRouter.get("/:orderId/payment", paymentController.getPaymentOrder)

export default orderRouter;