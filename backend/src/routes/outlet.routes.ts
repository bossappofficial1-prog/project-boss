import { Router } from "express";
import { createORderController } from "../controllers/order.controller";
import { jwtCheckToken } from "../middlewares/jwt_check_token";
import { getAllOutletController } from "../controllers/outlet.controller";

const outletRouter = Router()

outletRouter.get("/", getAllOutletController)
outletRouter.post("/:outletId/order", jwtCheckToken, createORderController)

export default outletRouter