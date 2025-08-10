import { Router } from "express";
import { createOrderController, getOrderByIdController, getOrderReceiptController, refundOrderController, updateOrderStatusController, completeOrderController, listGoodsOrdersByOutletController, listServiceQueueByOutletController } from "../controller/order.controller";
import { validateSchema } from "../middleware/zod.middleware";
import { createOrderSchema, updateOrderStatusSchema } from "../schemas/order.schema";
import { authorize, protect } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";
import { orderCreationLimiter, orderManagementLimiter } from "../middleware/order-rate-limit.middleware";
import { validateGuestCustomer, validateBusinessHours, validateOrderFrequency } from "../middleware/guest-validation.middleware";

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

export default orderRouter;