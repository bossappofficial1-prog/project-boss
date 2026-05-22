import { Router } from "express";
import { protect, authorize } from "../middleware/auth.middleware";
import { UserRole, StaffRole } from "@prisma/client";
import { getBadgeQueueAndOrderCount, ordersV2GetBoard } from "../controller/orders-v2.controller";

const ordersV2Router = Router();

ordersV2Router.use(protect, authorize(UserRole.OWNER, StaffRole.CASHIER));

ordersV2Router.get("/:outletId/board", ordersV2GetBoard);
ordersV2Router.get("/:outletId/badge", getBadgeQueueAndOrderCount);

export default ordersV2Router;
