import { Router } from "express";
import { authController } from "../controller/auth.controller";
import { sessionController } from "../controller/session.controller";
import { twoFactorController } from "../controller/two-factor.controller";
import { validateSchema } from "../middleware/zod.middleware";
import {
  loginSchema,
  verifySchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  cashierLoginSchema,
  completeRegisterSchema,
  managerLoginSchema,
} from "../schemas/auth.schema";

import { createUserSchema } from "../schemas/user.schema";
import { checkEmailExists } from "../validators/user.validator";
import { protect, authorize } from "../middleware/auth.middleware";
import { StaffRole } from "@prisma/client";
import passport from "../config/passport";
import {
  updatePasswordSchema,
  updateProfileSchema,
} from "../schemas/profile-setting.schema";

const authRouter = Router();

authRouter.get("/me", protect, authController.getMe);

authRouter.post("/logout", authController.logout);

authRouter.post("/login", validateSchema(loginSchema), authController.login);

authRouter.post(
  "/cashier/login",
  validateSchema(cashierLoginSchema),
  authController.cashierLogin,
);

authRouter.post(
  "/manager/login",
  validateSchema(managerLoginSchema),
  authController.managerLogin,
);

authRouter.get("/cashier/me", protect, authorize(StaffRole.CASHIER, StaffRole.MANAGER), authController.getCashierMe);

authRouter.post(
  "/register",
  validateSchema(createUserSchema),
  checkEmailExists,
  authController.register,
);

authRouter.post(
  "/onboarding/complete",
  protect,
  validateSchema(completeRegisterSchema),
  authController.completeOnboarding,
);

authRouter.post("/verify", validateSchema(verifySchema), authController.verify);

authRouter.post(
  "/resend-verification",
  validateSchema(resendVerificationSchema),
  authController.resendVerification,
);

authRouter.post(
  "/forgot-password",
  validateSchema(forgotPasswordSchema),
  authController.forgotPassword,
);

authRouter.post(
  "/reset-password",
  validateSchema(resetPasswordSchema),
  authController.resetPassword,
);

authRouter.get("/google", (req, res, next) => {
  const redirectPath =
    typeof req.query.redirect === "string" ? req.query.redirect : "/owner";
  const from = typeof req.query.from === "string" ? req.query.from : "login";

  const state = JSON.stringify({ redirect: redirectPath, from });

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state,
    session: false,
  })(req, res, next);
});

authRouter.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate(
      "google",
      { session: false },
      (error: unknown, user: any) => {
        (req as any).authError = error;
        (req as any).user = user || undefined;
        next();
      },
    )(req, res, next);
  },
  authController.googleOAuthCallback,
);

authRouter.patch(
  "/update-profile/:userId",
  validateSchema(updateProfileSchema),
  authController.updateProfile,
);

authRouter.patch(
  "/update-password/:userId",
  validateSchema(updatePasswordSchema),
  authController.updatePassword,
);

authRouter.post("/link-account", authController.linkAccount);

authRouter.get("/link-account", authController.getLinkAccountInfo);

// ── Session Management ──
authRouter.get("/sessions", protect, sessionController.listSessions);
authRouter.delete("/sessions/:sessionId", protect, sessionController.revokeSession);
authRouter.post("/sessions/revoke-others", protect, sessionController.revokeOtherSessions);

// ── 2FA / TOTP ──
authRouter.get("/2fa/status", protect, twoFactorController.getStatus);
authRouter.post("/2fa/setup", protect, twoFactorController.generateSetup);
authRouter.post("/2fa/verify", protect, twoFactorController.verifyAndEnable);
authRouter.post("/2fa/disable", protect, twoFactorController.disable);
authRouter.post("/2fa/regenerate-codes", protect, twoFactorController.regenerateBackupCodes);

// 2FA login (no protect - uses tempToken)
authRouter.post("/2fa/authenticate", twoFactorController.authenticate);

// 2FA action verification (requires login session)
authRouter.post("/2fa/verify-action", protect, twoFactorController.verifyAction);

export default authRouter;
