import { Router } from "express";
import { protect, authorizeOwnerOrCashier } from "../middleware/auth.middleware";
import { ordersV2GetBoard } from "../controller/orders-v2.controller";

const ordersV2Router = Router();

ordersV2Router.use(protect, authorizeOwnerOrCashier);

ordersV2Router.get("/:outletId/board", ordersV2GetBoard);

export default ordersV2Router;
