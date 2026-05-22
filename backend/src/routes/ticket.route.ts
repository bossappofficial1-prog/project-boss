import { Router } from "express";
import { protect, authorize } from "../middleware/auth.middleware";
import { UserRole, StaffRole } from "@prisma/client";
import {
  verifyTicketController,
  redeemTicketController,
  getTicketsByOrderController,
  getTicketCodesByProductController,
  printOrderTicketsController,
} from "../controller/ticket.controller";

const ticketRouter = Router();

// Public: verify ticket by code (customer / cashier scan)
ticketRouter.get("/verify/:code", verifyTicketController);

// Public: get ticket codes for an order (customer view)
ticketRouter.get("/order/:orderId", getTicketsByOrderController);

// Public/Protected: print tickets for an order
ticketRouter.get("/order/:orderId/print", printOrderTicketsController);

// Protected: get ticket codes by product (owner/cashier view)
ticketRouter.get("/product/:productId/codes", protect, authorize(UserRole.OWNER, StaffRole.CASHIER), getTicketCodesByProductController);

// Protected: redeem ticket (owner/cashier only)
ticketRouter.post("/redeem/:code", protect, authorize(UserRole.OWNER, StaffRole.CASHIER), redeemTicketController);

export default ticketRouter;
