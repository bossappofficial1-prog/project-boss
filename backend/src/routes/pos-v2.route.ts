import { Router } from "express";
import { protect, authorize } from "../middleware/auth.middleware";
import { validateSchema } from "../middleware/zod.middleware";
import { createPosV2OrderSchema } from "../schemas/pos-v2.schema";
import { UserRole, StaffRole } from "@prisma/client";
import {
    posV2GetProducts,
    posV2CreateOrder,
    posV2GetCashSummary,
    posV2GetOpenOrders,
    posV2GetRecentOrders,
    posV2GetBookingSlots,
    posV2GetAvailableStaff,
} from "../controller/pos-v2.controller";

const posV2Router = Router();

posV2Router.use(protect, authorize(UserRole.OWNER, StaffRole.CASHIER));

posV2Router.get("/products", posV2GetProducts);
posV2Router.post("/orders", validateSchema(createPosV2OrderSchema), posV2CreateOrder);
posV2Router.get("/cash-summary", posV2GetCashSummary);
posV2Router.get("/open-orders", posV2GetOpenOrders);
posV2Router.get("/recent-orders", posV2GetRecentOrders);
posV2Router.get("/products/:productId/booking-slots", posV2GetBookingSlots);
posV2Router.get("/products/:productId/available-staff", posV2GetAvailableStaff);

export default posV2Router;
