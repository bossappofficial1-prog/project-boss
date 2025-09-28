
import { Router } from "express";
import {
    createUserController,
    deleteUserController,
    getAllUserController,
    getUserByIdController,
    updateUserController
} from "../controller/user.controller";
import { validateSchema } from "../middleware/zod.middleware";
import {
    createUserSchema,
    updateUserSchema
} from "../schemas/user.schema";
import { checkEmailExists } from "../validators/user.validator";
import { authorize, protect } from "../middleware/auth.middleware";

const userRouter = Router()

userRouter.use(protect, authorize("ADMIN"))
userRouter.get("/", getAllUserController);

userRouter.post("/",
    validateSchema(createUserSchema),
    createUserController
)

userRouter.get(
    "/:userId",
    getUserByIdController);

userRouter.delete(
    "/:userId",
    deleteUserController);

userRouter.patch(
    "/:userId",
    validateSchema(updateUserSchema),
    checkEmailExists,
    updateUserController);


export default userRouter