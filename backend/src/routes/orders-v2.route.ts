import { Router } from "express";
import { protect, authorizeOwnerOrCashier } from "../middleware/auth.middleware";
import { getBadgeQueueAndOrderCount, ordersV2GetBoard } from "../controller/orders-v2.controller";

const ordersV2Router = Router();

ordersV2Router.use(protect, authorizeOwnerOrCashier);

ordersV2Router.get("/:outletId/board", ordersV2GetBoard);
ordersV2Router.get("/:outletId/badge", getBadgeQueueAndOrderCount);

export default ordersV2Router;
