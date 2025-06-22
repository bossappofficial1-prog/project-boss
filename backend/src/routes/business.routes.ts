import { Router } from "express";
import {
    getAllBusinessesController,
    getBusinessDetailController,
    getBusinessProductController
} from "../controllers/business.controller";

const businessRouter = Router()

businessRouter.get('/', getAllBusinessesController)
businessRouter.get('/:id/products', getBusinessProductController)
businessRouter.get('/:id/detail', getBusinessDetailController)

export default businessRouter