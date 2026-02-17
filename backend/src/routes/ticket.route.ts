import { Router } from "express";
import { protect, authorizeOwnerOrCashier } from "../middleware/auth.middleware";
import {
  verifyTicketController,
  redeemTicketController,
  getTicketsByOrderController,
  getTicketCodesByProductController,
} from "../controller/ticket.controller";

const ticketRouter = Router();

// Public: verify ticket by code (customer / cashier scan)
ticketRouter.get("/verify/:code", verifyTicketController);

// Public: get ticket codes for an order (customer view)
ticketRouter.get("/order/:orderId", getTicketsByOrderController);

// Protected: get ticket codes by product (owner/cashier view)
ticketRouter.get("/product/:productId/codes", protect, authorizeOwnerOrCashier, getTicketCodesByProductController);

// Protected: redeem ticket (owner/cashier only)
ticketRouter.post("/redeem/:code", protect, authorizeOwnerOrCashier, redeemTicketController);

export default ticketRouter;
