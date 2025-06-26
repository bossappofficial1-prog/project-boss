import { Router } from "express";
import { createORderController } from "../controllers/order.controller";
import { jwtCheckToken } from "../middlewares/jwt_check_token";

const outletRouter = Router()

outletRouter.post("/:outletId/order", jwtCheckToken, createORderController)

export default outletRouter