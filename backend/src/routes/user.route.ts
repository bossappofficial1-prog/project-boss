
import { Router } from "express";
import {
    createUserController,
    deleteUserController,
    getAllUserController,
    getUserByIdController,
    getUserDetailController,
    updateUserController
} from "../controller/user.controller";
import { validateSchema } from "../middleware/zod.middleware";
import {
    createUserByAdminSchema,
    updateUserSchema
} from "../schemas/user.schema";
import { checkEmailExists } from "../validators/user.validator";
import { authorize, protect } from "../middleware/auth.middleware";

const userRouter = Router()

userRouter.use(protect, authorize("ADMIN"))
userRouter.get("/", getAllUserController);

userRouter.post("/",
    validateSchema(createUserByAdminSchema),
    checkEmailExists,
    createUserController
)

userRouter.get(
    "/:userId",
    getUserByIdController);

userRouter.get(
    "/:userId/detail",
    getUserDetailController);

userRouter.delete(
    "/:userId",
    deleteUserController);

userRouter.patch(
    "/:userId",
    validateSchema(updateUserSchema),
    checkEmailExists,
    updateUserController);


export default userRouter