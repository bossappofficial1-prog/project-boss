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
import { ResponseUtil } from "../utils";
import { paymentMethod } from "../constants/payment-method";
import { SocketEmitter } from "../socket/socket-emiiter";
import receiptRouter from "./receipt-setting.route";
import bannerRouter from "./banner.route";
import serverRouter from "./server.route";
import subscriptionPlanRouter from "./subcription-plan.route";

const apiRouter = Router();

apiRouter.use('/users', userRouter)
apiRouter.use('/subscription-plans', subscriptionPlanRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/admin', adminRouter)
apiRouter.use('/banners', bannerRouter)
apiRouter.use('/products', productRouter)
apiRouter.use('/orders', orderRouter)
apiRouter.use('/server', serverRouter)
apiRouter.use('/dashboard', dashboardRouter)
apiRouter.use('/business', businessRouter)
apiRouter.use('/bookings', bookingRouter)
apiRouter.use('/payments', paymentRouter)
apiRouter.use('/outlets', outletRouter)
apiRouter.use('/home', homeRouter)
apiRouter.use('/expenses', expenseRouter)
apiRouter.use('/reports', reportRouter)
apiRouter.use('/staff', staffRouter)
apiRouter.use('/operating-hours', operatingHoursRouter)
apiRouter.use('/upload', uploadRouter)
apiRouter.use('/security', securityRouter)
apiRouter.use('/queue-monitoring', queueMonitoringRouter)
apiRouter.use('/notifications', notificationRouter)
apiRouter.use('/transactions', transactionRouter)
apiRouter.use("/stock", stockRouter);
apiRouter.use('/receipt-setting', receiptRouter)
apiRouter.get("/payment-methods", async (req, res) => { ResponseUtil.success(res, paymentMethod) })
apiRouter.get('/test-event/:outletId', (req, res) => {
  const outletId = req.params.outletId;
  SocketEmitter.getInstance().emitNotificationToOutlet(outletId, { message: 'Test', timestamp: new Date() })
  return ResponseUtil.success(res, {})
})

export default apiRouter;
