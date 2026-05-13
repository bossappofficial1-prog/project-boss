import { Router } from "express";
import { getMeController, loginController, logoutController, registerController, verifyController, resendVerificationController, forgotPasswordController, resetPasswordController, googleOAuthCallbackController, cashierLoginController, getCashierMeController, completeOnboardingController, updateProfileController, updatePasswordController } from "../controller/auth.controller";
import { validateSchema } from "../middleware/zod.middleware";
import { loginSchema, verifySchema, resendVerificationSchema, forgotPasswordSchema, resetPasswordSchema, cashierLoginSchema, completeRegisterSchema } from "../schemas/auth.schema";
import { createUserSchema } from "../schemas/user.schema";
import { checkEmailExists } from "../validators/user.validator";
import { protect } from "../middleware/auth.middleware";
import passport from "../config/passport";
import { updatePasswordSchema, updateProfileSchema } from "../schemas/profile-setting.schema";
import { config } from "../config";

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
        const redirectPath = typeof req.query.redirect === "string" ? req.query.redirect : "/owner";
        const isPopup = req.query.popup === "1";
        const state = JSON.stringify({
            redirect: redirectPath,
            popup: isPopup,
        });

        if (isPopup) {
            const cookiePath = req.baseUrl || "/api/v1/auth";

            res.cookie("google_oauth_popup", "1", {
                httpOnly: true,
                sameSite: "lax",
                secure: config.NODE_ENV === "production",
                maxAge: 10 * 60 * 1000,
                path: cookiePath,
            });
            res.cookie("google_oauth_redirect", redirectPath, {
                httpOnly: true,
                sameSite: "lax",
                secure: config.NODE_ENV === "production",
                maxAge: 10 * 60 * 1000,
                path: cookiePath,
            });
        }

        passport.authenticate("google", {
            scope: ["profile", "email"],
            state,
            session: false,
        })(req, res, next);
    }
);

authRouter.get("/google/callback",
    (req, res, next) => {
        passport.authenticate("google", { session: false }, (error: unknown, user: any) => {
            (req as any).authError = error;
            (req as any).user = user || undefined;
            next();
        })(req, res, next);
    },
    googleOAuthCallbackController
);

authRouter.patch("/update-profile/:userId",
    validateSchema(updateProfileSchema),
    updateProfileController)

authRouter.patch("/update-password/:userId",
    validateSchema(updatePasswordSchema),
    updatePasswordController)

export default authRouter;
