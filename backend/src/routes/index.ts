import { Router } from "express"
import authRouter from "./auth.routes"
import businessRouter from "./business.routes"

const apiRouter = Router()

apiRouter.use('/auth', authRouter)
apiRouter.use('/businesses', businessRouter)

export default apiRouter