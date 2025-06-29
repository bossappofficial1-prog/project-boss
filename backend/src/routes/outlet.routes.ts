import { Router } from "express";
import { createORderController } from "../controllers/order.controller";
import { jwtCheckToken } from "../middlewares/jwt_check_token";
import {
    createProductFoOutlet,
    getAllOutletController,
    getOutletByIdController,
    getOutletDashboard,
    getOutletOderGoods,
    getOutletOderService,
    getOutletProductController
} from "../controllers/outlet.controller";
import { authorizeOutletAccess } from "../middlewares/authorize_outlet_access";
import { createUploader } from "../configs/multer";
import { validateCreateProductForOutlet, validateUpdateProductForOutlet } from "../validators/product.validator";
import { handleValidationErrors } from "../middlewares/handle_validation_errors";
import { updateProductController } from "../controllers/product.controller";

const outletRouter = Router()
const imageProductUploader = createUploader("products", ['image/png', 'image/jpeg', 'image/jpg'], 1 * 1024 * 1024)

outletRouter.get("/", getAllOutletController)
outletRouter.get("/:id/products", getOutletProductController)

outletRouter.post(
    "/:outletId/products",
    jwtCheckToken,
    authorizeOutletAccess,
    imageProductUploader.single("image_product"),
    validateCreateProductForOutlet,
    handleValidationErrors,
    createProductFoOutlet
)

outletRouter.patch(
    "/:outletId/products/:productId",
    jwtCheckToken,
    authorizeOutletAccess,
    imageProductUploader.single("image_product"),
    validateUpdateProductForOutlet,
    handleValidationErrors,
    updateProductController
)

outletRouter.get("/:id", getOutletByIdController)

outletRouter.get(
    "/:outletId/dashboard",
    jwtCheckToken,
    authorizeOutletAccess,
    getOutletDashboard
)

outletRouter.get("/:id/orders-goods", getOutletOderGoods)
outletRouter.get("/:id/orders-service", getOutletOderService)
outletRouter.post("/:outletId/order", jwtCheckToken, createORderController)

export default outletRouter