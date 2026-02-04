import { Router } from "express";
import { getMeController, loginController, logoutController, registerController, verifyController, resendVerificationController, forgotPasswordController, resetPasswordController, googleOAuthCallbackController, cashierLoginController, getCashierMeController } from "../controller/auth.controller";
import { validateSchema } from "../middleware/zod.middleware";
import { loginSchema, verifySchema, resendVerificationSchema, forgotPasswordSchema, resetPasswordSchema, cashierLoginSchema } from "../schemas/auth.schema";
import { createUserSchema } from "../schemas/user.schema";
import { checkEmailExists } from "../validators/user.validator";
import { protect } from "../middleware/auth.middleware";
import passport from "../config/passport";
import { completeOnboardingController, renewSubscriptionController, getSubscriptionStatusController } from "../controller/onboarding.controller";
import { completeOnboardingSchema } from "../schemas/onboarding.schema";

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

// Onboarding routes
authRouter.post(
    "/onboarding/complete",
    protect,
    validateSchema(completeOnboardingSchema),
    completeOnboardingController
);

authRouter.post(
    "/subscription/renew",
    protect,
    renewSubscriptionController
);

authRouter.get(
    "/subscription/status",
    protect,
    getSubscriptionStatusController
);

export default authRouter;