
import { Router } from "express";
import {
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

const userRouter = Router()

userRouter.get("/", getAllUserController);

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