import { Router } from "express"
import authRouter from "./auth.routes"
import businessRouter from "./business.routes"
import outletRouter from "./outlet.routes"
import { validateMidtransSignature } from "../configs/midtrans"
import { MidtransNotifikasiController } from "../controllers/midtrans.controller"

const apiRouter = Router()

apiRouter.use('/auth', authRouter)
apiRouter.use('/businesses', businessRouter)
apiRouter.use('/outlets', outletRouter)
apiRouter.post("/midtrans-notification", MidtransNotifikasiController)
export default apiRouter