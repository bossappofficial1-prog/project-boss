import { Router } from "express";
import {
    getAllBusinessesController,
    getBusinessDetailController,
    getBusinessProductController,
    getBusinessWalletController
} from "../controllers/business.controller";
import { jwtCheckToken } from "../middlewares/jwt_check_token";

const businessRouter = Router()

businessRouter.get('/', getAllBusinessesController)
businessRouter.get('/wallet', jwtCheckToken, getBusinessWalletController)
businessRouter.get('/:id/products', getBusinessProductController)
businessRouter.get('/:id/detail', getBusinessDetailController)

export default businessRouter