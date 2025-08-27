import { Router } from "express";
import userRouter from "./user.route";
import authRouter from "./auth.route";
import membershipRouter from "./membership.route";
import productRouter from "./product.route";
import orderRouter from "./order.route";
import dashboardRouter from "./dashboard.route";
import bookingRouter from "./booking.route";
import paymentRouter from "./payment.route";
import businessRouter from "./business.route";
import homeRouter from "./home.route";
import outletRouter from "./outlet.route";
import expenseRouter from "./expense.route";
import reportRouter from "./report.route";
import { withdrawalRouter } from "./withdrawal.route";
import staffRouter from "./staff.route";
import operatingHoursRouter from "./operating-hours.route";
import uploadRouter from "./upload.route";
import securityRouter from "./security.route";
import queueMonitoringRouter from "./queue-monitoring.route";
import notificationRouter from "./notification.route";
import socketRouter from "./socket.routes";
import socketPublicRouter from "./socket-public.routes";

const apiRouter = Router()

apiRouter.use('/users', userRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/memberships', membershipRouter)
apiRouter.use('/products', productRouter)
apiRouter.use('/orders', orderRouter)
apiRouter.use('/dashboard', dashboardRouter)
apiRouter.use('/bookings', bookingRouter)
apiRouter.use('/payments', paymentRouter)
apiRouter.use('/business', businessRouter)
apiRouter.use('/outlets', outletRouter)
apiRouter.use('/home', homeRouter)
apiRouter.use('/expenses', expenseRouter)
apiRouter.use('/reports', reportRouter)
apiRouter.use('/withdrawals', withdrawalRouter)
apiRouter.use('/staff', staffRouter)
apiRouter.use('/operating-hours', operatingHoursRouter)
apiRouter.use('/upload', uploadRouter)
apiRouter.use('/security', securityRouter)
apiRouter.use('/queue-monitoring', queueMonitoringRouter)
apiRouter.use('/notifications', notificationRouter)
apiRouter.use('/socket', socketRouter)
apiRouter.use('/socket-public', socketPublicRouter)

export default apiRouter