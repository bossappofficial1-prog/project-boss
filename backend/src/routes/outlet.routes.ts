import { Router } from "express";
import { createORderController } from "../controllers/order.controller";
import { jwtCheckToken } from "../middlewares/jwt_check_token";
import { getAllOutletController, getOutletByIdController, getOutletOderGoods, getOutletOderService, getOutletProductController } from "../controllers/outlet.controller";

const outletRouter = Router()

outletRouter.get("/", getAllOutletController)
outletRouter.get("/:id/products", getOutletProductController)
outletRouter.get("/:id", getOutletByIdController)
outletRouter.get("/:id/orders-goods", getOutletOderGoods)
outletRouter.get("/:id/orders-service", getOutletOderService)
outletRouter.post("/:outletId/order", jwtCheckToken, createORderController)

export default outletRouter