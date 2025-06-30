import { Router } from "express";
import {
    createBusinessOutletController,
    getAllBusinessesController,
    getBusinessDetailController,
    getBusinessProductController,
    getBusinessWalletController
} from "../controllers/business.controller";
import { jwtCheckToken } from "../middlewares/jwt_check_token";
import { authorizeOutletAccess } from "../middlewares/authorize_outlet_access";
import { createOutletValidator } from "../validators/outlet.validator";
import { handleValidationErrors } from "../middlewares/handle_validation_errors";
import { formDataParser } from "../middlewares/form_data_parse";
import { createUploader } from "../configs/multer";

const businessRouter = Router()
const imageOutletUploader = createUploader("outlets", ['image/png', 'image/jpeg', 'image/jpg'], 1 * 1024 * 1024)

businessRouter.get('/', getAllBusinessesController)

businessRouter.post(
    '/:businessId/outlet',
    jwtCheckToken,
    imageOutletUploader.single("image"),
    createOutletValidator,
    handleValidationErrors,
    createBusinessOutletController
)

businessRouter.get('/wallet', jwtCheckToken, getBusinessWalletController)
businessRouter.get('/:id/products', getBusinessProductController)
businessRouter.get('/:id/detail', getBusinessDetailController)

export default businessRouter