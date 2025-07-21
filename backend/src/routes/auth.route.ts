import { Router } from "express";
import { getMeController, loginController, logoutController, registerController, verifyController } from "../controller/auth.controller";
import { validateSchema } from "../middleware/zod.middleware";
import { loginSchema, verifySchema } from "../schemas/auth.schema";
import { createUserSchema } from "../schemas/user.schema";
import { checkEmailExists } from "../validators/user.validator";
import { protect } from "../middleware/auth.middleware";

const authRouter = Router();

authRouter.get("/me", protect, getMeController);

authRouter.post("/logout", protect, logoutController);

authRouter.post(
    "/login",
    validateSchema(loginSchema),
    loginController
);

authRouter.post(
    "/register",
    validateSchema(createUserSchema),
    checkEmailExists,
    registerController
);

authRouter.post(
    "/verify",
    validateSchema(verifySchema),
    verifyController
);

export default authRouter;