import { Router } from "express";
import { createORderController } from "../controllers/order.controller";
import { jwtCheckToken } from "../middlewares/jwt_check_token";
import { getAllOutletController, getOutletByIdController, getOutletProductController } from "../controllers/outlet.controller";

const outletRouter = Router()

outletRouter.get("/", getAllOutletController)
outletRouter.get("/:id/products", getOutletProductController)
outletRouter.get("/:id", getOutletByIdController)
outletRouter.post("/:outletId/order", jwtCheckToken, createORderController)

export default outletRouter