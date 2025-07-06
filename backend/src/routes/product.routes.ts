import { Router } from "express";
import { createProductOrder } from "../controllers/product.controller";

const productRouter = Router()

productRouter.post("/:productId/orders", createProductOrder)

export default productRouter