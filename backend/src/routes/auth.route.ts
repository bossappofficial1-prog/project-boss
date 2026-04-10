import { Router } from "express";
import { getMeController, loginController, logoutController, registerController, verifyController, resendVerificationController, forgotPasswordController, resetPasswordController, googleOAuthCallbackController, cashierLoginController, getCashierMeController, completeOnboardingController, updateProfileController, updatePasswordController } from "../controller/auth.controller";
import { validateSchema } from "../middleware/zod.middleware";
import { loginSchema, verifySchema, resendVerificationSchema, forgotPasswordSchema, resetPasswordSchema, cashierLoginSchema, completeRegisterSchema } from "../schemas/auth.schema";
import { createUserSchema } from "../schemas/user.schema";
import { checkEmailExists } from "../validators/user.validator";
import { protect } from "../middleware/auth.middleware";
import passport from "../config/passport";
import { updatePasswordSchema, updateProfileSchema } from "../schemas/profile-setting.schema";

const authRouter = Router();

authRouter.get("/me", protect, getMeController);

authRouter.post("/logout", logoutController);

authRouter.post(
    "/login",
    validateSchema(loginSchema),
    loginController
);

authRouter.post(
    "/cashier/login",
    validateSchema(cashierLoginSchema),
    cashierLoginController
);

authRouter.get("/cashier/me", protect, getCashierMeController);

authRouter.post(
    "/register",
    validateSchema(createUserSchema),
    checkEmailExists,
    registerController
);

authRouter.post(
    "/onboarding/complete",
    protect,
    validateSchema(completeRegisterSchema),
    completeOnboardingController
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
        const redirectPath = req.query.redirect || '/owner/dashboard';

        passport.authenticate("google", {
            scope: ["profile", "email"],
            state: redirectPath as string
        })(req, res, next);
    }
);

authRouter.get("/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth/login?error=oauth_failed" }),
    googleOAuthCallbackController
);

authRouter.patch("/update-profile/:userId",
    validateSchema(updateProfileSchema),
    updateProfileController)

authRouter.patch("/update-password/:userId",
    validateSchema(updatePasswordSchema),
    updatePasswordController)

export default authRouter;