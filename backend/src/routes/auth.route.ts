import { Router } from "express";
import { getMeController, loginController, logoutController, registerController, verifyController, resendVerificationController, forgotPasswordController, resetPasswordController, googleOAuthCallbackController } from "../controller/auth.controller";
import { validateSchema } from "../middleware/zod.middleware";
import { loginSchema, verifySchema, resendVerificationSchema, forgotPasswordSchema, resetPasswordSchema } from "../schemas/auth.schema";
import { createUserSchema } from "../schemas/user.schema";
import { checkEmailExists } from "../validators/user.validator";
import { protect } from "../middleware/auth.middleware";
import passport from "../config/passport";

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

authRouter.post(
    "/resend-verification",
    validateSchema(resendVerificationSchema),
    resendVerificationController
);

authRouter.post(
    "/forgot-password",
    validateSchema(forgotPasswordSchema),
    forgotPasswordController
);

authRouter.post(
    "/reset-password",
    validateSchema(resetPasswordSchema),
    resetPasswordController
);

authRouter.get("/google",
    (req, res, next) => {
        const state = req.query.redirect || '/owner/dashboard';
        (req.session as any).redirectUrl = state;
        next();
    },
    passport.authenticate("google", { scope: ["profile", "email"] })
);

authRouter.get("/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth/login" }),
    googleOAuthCallbackController
);

export default authRouter;