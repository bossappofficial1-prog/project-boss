import { Router } from "express";
import userRouter from "./user.route";
import authRouter from "./auth.route";

import productRouter from "./product.route";
import orderRouter from "./order.route";
import dashboardRouter from "./dashboard.route";
import businessRouter from "./business.route";
import bookingRouter from "./booking.route";
import paymentRouter from "./payment.route";
import homeRouter from "./home.route";
import outletRouter from "./outlet.route";
import expenseRouter from "./expense.route";
import reportRouter from "./report.route";

import staffRouter from "./staff.route";
import operatingHoursRouter from "./operating-hours.route";
import uploadRouter from "./upload.route";
import securityRouter from "./security.route";
import queueMonitoringRouter from "./queue-monitoring.route";
import notificationRouter from "./notification.route";
import adminRouter from "./admin.route";
import transactionRouter from "./transaction.route";
import stockRouter from "./stock.route";
import supplierRouter from "./supplier.route";
import { ResponseUtil } from "../utils";
import { paymentMethod } from "../constants/payment-method";
import { SocketEmitter } from "../socket/socket-emiiter";
import receiptRouter from "./receipt-setting.route";
import bannerRouter from "./banner.route";
import serverRouter from "./server.route";
import subscriptionPlanRouter from "./subcription-plan.route";
import subscriptionRouter from "./subscription.route";
import posV2Router from "./pos-v2.route";
import queueV2Router from "./queue-v2.route";
import ordersV2Router from "./orders-v2.route";
import ticketRouter from "./ticket.route";
import memberRouter from "./member.route";
import loyaltyRouter from "./loyalty.route";
import pushNotification from "./push-notification.routes";
import tableRouter from "./table.route";
import billRouter from "./bill.route";
import toolsRouter from "./tools.routes";
import cashierShiftRouter from "./cashier-shift.route";
import reservationRouter from "./reservation.route";
import transactionDeleteRouter from "./transaction-delete.route";

const apiRouter = Router();

apiRouter.use("/admin", adminRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/banners", bannerRouter);
apiRouter.use("/bookings", bookingRouter);
apiRouter.use("/business", businessRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/expenses", expenseRouter);
apiRouter.use("/home", homeRouter);
apiRouter.use("/members", memberRouter);
apiRouter.use("/loyalty", loyaltyRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/operating-hours", operatingHoursRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/orders/v2", ordersV2Router);
apiRouter.use("/bills", billRouter);
apiRouter.use("/outlets", outletRouter);
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/pos/v2", posV2Router);
apiRouter.use("/products", productRouter);
apiRouter.use("/push-notification", pushNotification);
apiRouter.use("/queue-monitoring", queueMonitoringRouter);
apiRouter.use("/queue/v2", queueV2Router);
apiRouter.use("/receipt-setting", receiptRouter);
apiRouter.use("/reports", reportRouter);
apiRouter.use("/security", securityRouter);
apiRouter.use("/server", serverRouter);
apiRouter.use("/staff", staffRouter);
apiRouter.use("/stock", stockRouter);
apiRouter.use("/suppliers", supplierRouter);
apiRouter.use("/subscription", subscriptionRouter);
apiRouter.use("/subscription-plans", subscriptionPlanRouter);
apiRouter.use("/tickets", ticketRouter);
apiRouter.use("/transactions", transactionRouter);
apiRouter.use("/tables", tableRouter);
apiRouter.use("/tools", toolsRouter);
apiRouter.use("/cashier-shifts", cashierShiftRouter);
apiRouter.use("/upload", uploadRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/reservations", reservationRouter);
apiRouter.use("/transaction-deletes", transactionDeleteRouter);

apiRouter.get("/payment-methods", async (req, res) => {
  ResponseUtil.success(res, paymentMethod);
});

apiRouter.get("/test-event/:outletId", (req, res) => {
  const outletId = req.params.outletId;
  SocketEmitter.getInstance().emitNotificationToOutlet(outletId, {
    message: "Test",
    timestamp: new Date(),
  });
  return ResponseUtil.success(res, {});
});

export default apiRouter;
