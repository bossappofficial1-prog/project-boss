import { Router } from "express";
import { createBannerController, deleteBannerController, getBannersController, updateBannerController } from "../controller/banner.controller";
import { authorize, protect } from "../middleware/auth.middleware";
import { validateSchema } from "../middleware/zod.middleware";
import { createBannerSchema, updateBannerSchema } from "../schemas/banner.schema";

const bannerRouter = Router()

bannerRouter.use(protect, authorize("ADMIN"))
bannerRouter.get('/', getBannersController)
bannerRouter.delete('/:id', deleteBannerController)
bannerRouter.put(
    '/:id',
    validateSchema(updateBannerSchema),
    updateBannerController
)
bannerRouter.post(
    '/',
    validateSchema(createBannerSchema),
    createBannerController
)


export default bannerRouter