import { Router } from "express";
import {
    googleLoginController,
    loginController,
    registerController,
    resendOtpController,
    verifyOtpController
} from "../controllers/auth.controller";
import { loginValidator, registerValidator } from "../validators/auth.validator";
import { handleValidationErrors } from "../middlewares/handle_validation_errors";

const authRouter = Router()

authRouter.post('/register', registerValidator, handleValidationErrors, registerController)
authRouter.post('/login', loginValidator, handleValidationErrors, loginController)
authRouter.post('/login-google', googleLoginController)
authRouter.post('/resend-otp', resendOtpController)
authRouter.post('/verify-otp', verifyOtpController)

export default authRouter